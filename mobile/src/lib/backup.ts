import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { exportSnapshot, replaceAll } from '@/data/store';
import { EMPTY_SNAPSHOT, Snapshot } from '@/data/types';
import { dayKey } from '@/lib/dates';

/**
 * Backups are a single JSON file the person owns. Without an account this is
 * how they move their journal to a new phone. Vision board photos are not
 * included (they stay on the device), only the cards' titles and layout.
 */

const FORMAT = 'synchros-backup';
const VERSION = 1;

type BackupFile = { format: string; version: number; exportedAt: string; data: Snapshot };

export function backupJson(): string {
  const file: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: exportSnapshot(),
  };
  return JSON.stringify(file, null, 2);
}

export async function shareBackup(): Promise<'shared' | 'unavailable'> {
  const json = backupJson();
  const name = `synchros-backup-${dayKey(new Date())}.json`;
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    return 'shared';
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your Synchros backup',
    UTI: 'public.json',
  });
  return 'shared';
}

function isArr(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

/** Validates a parsed backup. Returns a clean snapshot or throws a readable error. */
export function parseBackup(raw: string): Snapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('That file isn’t a Synchros backup. Choose a .json file exported from Synchros.');
  }
  const f = parsed as Partial<BackupFile>;
  if (f.format !== FORMAT || typeof f.version !== 'number' || !f.data) {
    throw new Error('That file isn’t a Synchros backup. Choose a .json file exported from Synchros.');
  }
  if (f.version > VERSION) {
    throw new Error('This backup was made by a newer version of Synchros. Update the app, then try again.');
  }
  const d = f.data as Partial<Snapshot>;
  const snap: Snapshot = {
    intentions: isArr(d.intentions) ? d.intentions : [],
    signs: isArr(d.signs) ? d.signs : [],
    // Photos aren't part of backups, so restored cards keep their place without an image.
    cards: isArr(d.cards) ? d.cards.map((c) => ({ ...c, imageName: null })) : [],
    reflections: isArr(d.reflections) ? d.reflections : [],
    stages: isArr(d.stages) ? d.stages : [],
    kv: typeof d.kv === 'object' && d.kv ? d.kv : EMPTY_SNAPSHOT.kv,
  };
  const ids = (rows: { id?: unknown }[]) => rows.every((r) => typeof r?.id === 'string');
  if (![snap.intentions, snap.signs, snap.cards, snap.reflections, snap.stages].every(ids)) {
    throw new Error('This backup is damaged and can’t be restored.');
  }
  return snap;
}

/** Lets the person pick a backup file. Returns null if they cancel. */
export async function pickBackup(): Promise<Snapshot | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  const text =
    Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return parseBackup(text);
}

export async function restoreBackup(snapshot: Snapshot) {
  await replaceAll({ ...snapshot, kv: { ...snapshot.kv, onboarded: '1' } });
}
