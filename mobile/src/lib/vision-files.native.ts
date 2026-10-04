import { Directory, File, Paths } from 'expo-file-system';

import { newId } from './id';

/**
 * Vision board images are copied into the app's own documents folder so they
 * survive the system clearing the picker cache. We store only the file NAME:
 * on iOS the absolute documents path can change between app updates.
 */

function visionDir() {
  const dir = new Directory(Paths.document, 'vision');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function importImage(sourceUri: string): string {
  const source = new File(sourceUri);
  const ext = (source.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = `${newId()}.${ext || 'jpg'}`;
  source.copy(new File(visionDir(), name));
  return name;
}

export function imageUri(name: string | null): string | null {
  if (!name) return null;
  return new File(visionDir(), name).uri;
}

export function deleteImage(name: string | null) {
  if (!name) return;
  try {
    const f = new File(visionDir(), name);
    if (f.exists) f.delete();
  } catch {
    // Missing file is fine.
  }
}

export function deleteAllImages() {
  try {
    const dir = new Directory(Paths.document, 'vision');
    if (dir.exists) dir.delete();
  } catch {
    // Nothing to remove.
  }
}
