import { genHashByXXH, randomHash } from '@utils/hash';

describe('utils/hash', () => {
  test('genHashByXXH is deterministic and returns hex string', () => {
    const v1 = genHashByXXH('hello-world');
    const v2 = genHashByXXH('hello-world');
    expect(typeof v1).toBe('string');
    expect(v1).toMatch(/^[0-9a-f]+$/i);
    expect(v1).toBe(v2);
  });

  test('randomHash with mocked Math.random produces deterministic output', () => {
    const orig = Math.random;
    try {
      // force Math.random to always return 0 so we pick first char repeatedly
      (Math as any).random = jest.fn().mockReturnValue(0);
      const r = randomHash(5);
      expect(r).toHaveLength(5);
      const charsetFirst = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'.charAt(0);
      expect(r).toBe(charsetFirst.repeat(5));
    } finally {
      (Math as any).random = orig;
    }
  });
});
