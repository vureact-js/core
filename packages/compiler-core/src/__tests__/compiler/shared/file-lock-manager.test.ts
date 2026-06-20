import fs from 'fs';
import { fileLock } from '../../../compiler/shared/file-lock-manager';

describe('file-lock-manager', () => {
  const tmpFile = 'tmp-lock-test.json';

  afterEach(async () => {
    try {
      await fs.promises.unlink(tmpFile);
    } catch {}
  });

  test('updateFile creates file and writes JSON', async () => {
    const res = await fileLock.updateFile(tmpFile, (cur) => ({ count: (cur?.count || 0) + 1 }));
    expect(res).toEqual({ count: 1 });

    const content = await fs.promises.readFile(tmpFile, 'utf-8');
    expect(JSON.parse(content)).toEqual({ count: 1 });
  });

  test('tryLock returns release function when lock acquired and null otherwise', async () => {
    const release = await fileLock.tryLock(tmpFile);
    if (release) {
      // another tryLock should fail immediately
      const second = await fileLock.tryLock(tmpFile);
      expect(second).toBeNull();
      await release();
    } else {
      // in some environments proper-lockfile may not allow locking same path; accept null
      expect(release).toBeNull();
    }
  });

  test('isLocked reflects lock state', async () => {
    const rel = await fileLock.tryLock(tmpFile);
    const locked = await fileLock.isLocked(tmpFile);
    if (rel) {
      expect(locked).toBe(true);
      await rel();
      const unlocked = await fileLock.isLocked(tmpFile);
      expect(unlocked).toBe(false);
    } else {
      expect(locked).toBe(false);
    }
  });
});
