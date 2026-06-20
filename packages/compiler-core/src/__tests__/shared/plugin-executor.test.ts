import { executePlugins } from '@shared/plugin-executor';

describe('shared/plugin-executor', () => {
  test('executes plugins and swallows exceptions', () => {
    const result: any = {};
    const ctx = { x: 1 };

    const map: any = {
      ok: (r: any) => {
        r.ok = true;
      },
      bad: () => {
        throw new Error('fail');
      },
    };

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      executePlugins(map, result, ctx);
      expect(result.ok).toBe(true);
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
