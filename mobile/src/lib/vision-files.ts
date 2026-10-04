/** Web preview: picked images are kept as their (blob/data) URI directly. */

export function importImage(sourceUri: string): string {
  return sourceUri;
}

export function imageUri(name: string | null): string | null {
  return name;
}

export function deleteImage(_name: string | null) {}

export function deleteAllImages() {}
