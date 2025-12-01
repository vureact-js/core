import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getDirname(metaUrl: string) {
  return dirname(fileURLToPath(metaUrl));
}

export function getFilename(metaUrl: string) {
  return fileURLToPath(metaUrl);
}
