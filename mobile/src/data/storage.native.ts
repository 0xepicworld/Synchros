import * as SQLite from 'expo-sqlite';

import { COLUMNS, KV, Snapshot, Storage, TableName, Tables } from './types';

/**
 * On-device storage (iOS / Android) backed by SQLite.
 *
 * Deliberately no foreign keys: links (sign → intention) are maintained by the
 * store so that an upsert can never cascade into unrelated rows.
 */

const DB_NAME = 'synchros.db';
const DB_VERSION = 1;

const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS intentions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      script TEXT NOT NULL DEFAULT '',
      category TEXT,
      emotion TEXT,
      keywords TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      outcome TEXT,
      createdAt TEXT NOT NULL,
      completedAt TEXT,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS signs (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      kind TEXT,
      intentionId TEXT,
      intensity INTEGER NOT NULL DEFAULT 3,
      occurredAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS signs_intention ON signs (intentionId);
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      imageName TEXT,
      x REAL NOT NULL DEFAULT 0.5,
      y REAL NOT NULL DEFAULT 0.5,
      scale REAL NOT NULL DEFAULT 1,
      rotation REAL NOT NULL DEFAULT 0,
      z INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reflections (
      id TEXT PRIMARY KEY NOT NULL,
      insight INTEGER NOT NULL,
      prompt INTEGER NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stages (
      id TEXT PRIMARY KEY NOT NULL,
      insight INTEGER NOT NULL,
      startedAt TEXT,
      practiceDoneAt TEXT,
      completedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `,
};

const TABLES = Object.keys(COLUMNS) as TableName[];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < DB_VERSION) {
    const next = version + 1;
    const sql = MIGRATIONS[next];
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

function upsertSql(table: TableName) {
  const cols = COLUMNS[table] as string[];
  const placeholders = cols.map(() => '?').join(', ');
  const updates = cols
    .filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})
          ON CONFLICT(id) DO UPDATE SET ${updates}`;
}

function values<T extends TableName>(table: T, row: Tables[T]): SQLite.SQLiteBindValue[] {
  return (COLUMNS[table] as (keyof Tables[T])[]).map((c) => {
    const v = row[c] as unknown;
    return v === undefined ? null : (v as SQLite.SQLiteBindValue);
  });
}

async function writeSnapshot(db: SQLite.SQLiteDatabase, snapshot: Snapshot) {
  for (const t of TABLES) {
    await db.runAsync(`DELETE FROM ${t}`);
    const sql = upsertSql(t);
    for (const row of snapshot[t] as Tables[typeof t][]) {
      await db.runAsync(sql, values(t, row));
    }
  }
  await db.runAsync('DELETE FROM kv');
  for (const [key, value] of Object.entries(snapshot.kv)) {
    if (value != null) await db.runAsync('INSERT INTO kv (key, value) VALUES (?, ?)', key, value);
  }
}

export const storage: Storage = {
  async init() {
    const db = await getDb();
    const [intentions, signs, cards, reflections, stages, kvRows] = await Promise.all([
      db.getAllAsync<Tables['intentions']>('SELECT * FROM intentions'),
      db.getAllAsync<Tables['signs']>('SELECT * FROM signs'),
      db.getAllAsync<Tables['cards']>('SELECT * FROM cards'),
      db.getAllAsync<Tables['reflections']>('SELECT * FROM reflections'),
      db.getAllAsync<Tables['stages']>('SELECT * FROM stages'),
      db.getAllAsync<{ key: string; value: string | null }>('SELECT key, value FROM kv'),
    ]);
    const kv: KV = {};
    for (const { key, value } of kvRows) {
      if (value != null) (kv as Record<string, string>)[key] = value;
    }
    return { intentions, signs, cards, reflections, stages, kv };
  },

  async upsert(table, row) {
    const db = await getDb();
    await db.runAsync(upsertSql(table), values(table, row));
  },

  async remove(table, id) {
    const db = await getDb();
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
  },

  async setKV(key, value) {
    const db = await getDb();
    if (value == null) {
      await db.runAsync('DELETE FROM kv WHERE key = ?', key);
    } else {
      await db.runAsync(
        'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        value,
      );
    }
  },

  async replaceAll(snapshot) {
    const db = await getDb();
    await db.withTransactionAsync(() => writeSnapshot(db, snapshot));
  },

  async wipe() {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const t of TABLES) await db.runAsync(`DELETE FROM ${t}`);
      await db.runAsync('DELETE FROM kv');
    });
  },
};
