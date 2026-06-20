import { Helper } from '@compiler/shared/helper';
import path from 'path';

jest.mock('@plugins/prettier', () => ({
  formatWithPrettier: jest.fn(async () => 'prettier'),
  simpleFormat: jest.fn(() => 'simple'),
}));

describe('Helper (partial)', () => {
  const root = process.cwd();
  const opts: any = {
    root,
    input: 'src',
    output: { outDir: 'dist', workspace: '.vureact-test', ignoreAssets: ['foo.txt'] },
  };
  const helper = new Helper(opts);

  test('basic path helpers', () => {
    expect(helper.getProjectRoot()).toBe(root);
    expect(helper.getInputPath()).toBe(path.resolve(root, 'src'));
    expect(helper.getOutDirName()).toBe('dist');
    expect(helper.getWorkspaceDir()).toBe(path.resolve(root, '.vureact-test'));
    expect(helper.getRootPkgPath()).toBe(path.join(root, 'package.json'));
    expect(helper.getOutputPkgPath()).toBe(path.join(helper.getOuputPath(), 'package.json'));
  });

  test('ignore assets and cache flag', () => {
    const ignores = helper.getIgnoreAssets();
    expect(ignores.has('foo.txt')).toBe(true);
    expect(helper.getIsCache()).toBe(true); // default true when not provided
  });

  test('relative and replace vue ext', () => {
    const filePath = path.resolve(root, 'src', 'comp.vue');
    const replaced = helper.replaceVueFileExt(filePath, '.jsx');
    expect(replaced.endsWith('.jsx')).toBe(true);
    const rel = helper.relativePath(filePath);
    expect(typeof rel).toBe('string');
  });

  test('genHash and compareFileMeta', async () => {
    const h = helper.genHash('abc');
    expect(typeof h).toBe('string');

    const a = { fileSize: 10, mtime: 100 };
    const b = { fileSize: 10, mtime: 100 };
    expect(helper.compareFileMeta(a as any, b as any)).toBe(true);
  });

  test('updateCache updates existing and pushes new', () => {
    const cache: any = { target: [{ file: 'a', data: 1 }] };
    helper.updateCache('a', { file: 'a', data: 2 }, cache);
    expect(cache.target.find((c: any) => c.file === 'a').data).toBe(2);

    helper.updateCache('b', { file: 'b', data: 3 }, cache);
    expect(cache.target.find((c: any) => c.file === 'b').data).toBe(3);
  });

  test('resolveRelativePath removes extension and normalizes', () => {
    const from = path.resolve(root, 'src');
    const to = path.resolve(root, 'src', 'lib', 'mod.js');
    const rel = helper.resolveRelativePath(from, to);
    expect(rel.startsWith('./')).toBe(true);
    expect(rel.includes('mod')).toBe(true);
  });

  test('checkCacheStatus branches', async () => {
    const current = { fileSize: 1, mtime: 2 } as any;

    // no cache
    const r1 = await helper.checkCacheStatus(current, undefined, async () => 'x');
    expect(r1.shouldCompile).toBe(true);

    // same meta
    const cached = { fileSize: 1, mtime: 2 } as any;
    const r2 = await helper.checkCacheStatus(current, cached, async () => 'x');
    expect(r2.shouldCompile).toBe(false);

    // changed meta but same hash
    const cached2: any = { fileSize: 0, mtime: 0, hash: helper.genHash('hello') };
    const r3 = await helper.checkCacheStatus(current, cached2, async () => 'hello');
    expect(r3.shouldCompile).toBe(false);

    // changed meta and different hash
    const cached3: any = { fileSize: 0, mtime: 0, hash: 'different' };
    const r4 = await helper.checkCacheStatus(current, cached3, async () => 'hello');
    expect(r4.shouldCompile).toBe(true);
    expect(typeof r4.hash).toBe('string');
  });
});
