import { fileLock } from '@compiler/shared/file-lock-manager';
import { Helper } from '@compiler/shared/helper';
import { logger } from '@shared/logger';
import fs from 'fs';
import path from 'path';

describe('Helper I/O (partial)', () => {
  const root = process.cwd();
  const opts: any = {
    root,
    input: 'src',
    output: { outDir: 'dist', workspace: '.vureact-test-io' },
  };
  const helper = new Helper(opts);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('writeFileWithDir uses fileLock when lock option is true', async () => {
    const spy = jest.spyOn(fileLock, 'updateFile').mockResolvedValue('ok' as any);

    const tmp = path.resolve(root, '.tmp_helper_lock.json');
    await helper.writeFileWithDir(tmp, '{"a":1}', { lock: true } as any);

    expect(spy).toHaveBeenCalled();
  });

  test('rmFile removes existing file', async () => {
    const tmpDir = path.resolve(root, '.tmp_helper_io');
    const tmpFile = path.join(tmpDir, 'tfile.txt');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    await fs.promises.writeFile(tmpFile, 'hello', 'utf-8');

    await helper.rmFile(tmpFile);

    expect(fs.existsSync(tmpFile)).toBe(false);
    // cleanup
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test('getFileMeta returns size and mtime', async () => {
    const tmpDir = path.resolve(root, '.tmp_helper_io2');
    const tmpFile = path.join(tmpDir, 'tfile2.txt');
    await fs.promises.mkdir(tmpDir, { recursive: true });
    await fs.promises.writeFile(tmpFile, 'hello2', 'utf-8');

    const meta = await helper.getFileMeta(tmpFile);
    expect(meta.fileSize).toBeGreaterThan(0);
    expect(typeof meta.mtime).toBe('number');

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  test('printCoreLogs uses logger when logs exist', () => {
    jest.spyOn(logger, 'getLogs').mockReturnValue([1] as any);
    const printSpy = jest.spyOn(logger, 'printAll').mockImplementation(() => ({}) as any);
    const clearSpy = jest.spyOn(logger, 'clear').mockImplementation(() => ({}) as any);

    helper.printCoreLogs();

    expect(printSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
  });
});
