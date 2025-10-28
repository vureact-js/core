import { createHash } from 'crypto';

export function shortHash(length = 8): string {
  const randomString = Math.random().toString().slice(2, 12);
  const hash = createHash('sha1')
    .update(randomString)
    .digest('base64url')
    .slice(0, length);
  const firstChar = hash.charAt(0).toUpperCase();
  return firstChar + hash.slice(1);
}
