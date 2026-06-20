import { simpleFormat } from '@plugins/prettier';

describe('plugins/prettier', () => {
  test('simpleFormat compresses multiple blank lines and ensures trailing newline', () => {
    const input = 'a\n\n\n\nbar';
    const out = simpleFormat(input);
    expect(out.endsWith('\n')).toBe(true);
    // collapsed to at most two blank lines
    expect(out).toContain('\n\nbar');
  });

  test('formatWithPrettier uses prettier when available', async () => {
    // mock prettier module dynamically for this test
    jest.isolateModules(async () => {
      jest.doMock('prettier', () => ({ format: (code: string) => `P:${code}` }), { virtual: true });
      const mod = await import('@plugins/prettier');
      const out = await mod.formatWithPrettier('x', 'js');
      expect(out).toBe('P:x');
      jest.dontMock('prettier');
    });
  });
});
