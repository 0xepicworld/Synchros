import { EMPTY_SNAPSHOT, Snapshot, Storage, TableName } from './types';

/**
 * Web fallback storage (localStorage). Used for browser previews only;
 * the phone app uses storage.native.ts (SQLite).
 */

const KEY = 'synchros.v1';

function read(): Snapshot {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return structuredClone(EMPTY_SNAPSHOT);
    return { ...structuredClone(EMPTY_SNAPSHOT), ...(JSON.parse(raw) as Partial<Snapshot>) };
  } catch {
    return structuredClone(EMPTY_SNAPSHOT);
  }
}

function write(s: Snapshot) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or unavailable (private mode). Data stays in memory for this session.
  }
}

export const storage: Storage = {
  async init() {
    return read();
  },
  async upsert(table, row) {
    const s = read();
    const list = s[table] as { id: string }[];
    const i = list.findIndex((r) => r.id === row.id);
    if (i >= 0) list[i] = row;
    else list.push(row);
    write(s);
  },
  async remove(table: TableName, id: string) {
    const s = read();
    s[table] = (s[table] as { id: string }[]).filter((r) => r.id !== id) as never;
    write(s);
  },
  async setKV(key, value) {
    const s = read();
    if (value == null) delete s.kv[key];
    else (s.kv as Record<string, string>)[key] = value;
    write(s);
  },
  async replaceAll(snapshot) {
    write(snapshot);
  },
  async wipe() {
    write(structuredClone(EMPTY_SNAPSHOT));
  },
};
