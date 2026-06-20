import { Logger } from '@shared/logger';

describe('shared/logger', () => {
  test('add logs, query and clear', () => {
    const l = new Logger();
    l.warn('w', { file: 'f.ts', loc: { start: { line: 2, column: 1 } }, source: 'a\nb\nc' });
    l.error('e');
    l.info('i');

    const logs = l.getLogs();
    expect(logs.length).toBe(3);
    expect(l.hasErrors()).toBe(true);
    expect(l.hasWarnings()).toBe(true);

    l.clear();
    expect(l.getLogs().length).toBe(0);
  });

  test('printAll prints context and summary', () => {
    const l = new Logger();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      l.error('err', {
        file: 'file.ts',
        loc: { start: { line: 2, column: 1 } },
        source: 'one\ntwo\nthree',
      });
      l.warn('warn', { file: 'file.ts' });
      l.printAll();

      expect(spy).toHaveBeenCalled();
      const calls = spy.mock.calls.flat().join(' ');
      // pointer caret should be present in context output
      expect(calls).toMatch(/\^/);
    } finally {
      spy.mockRestore();
    }
  });
});
