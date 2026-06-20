import { parseOnlyStyle } from '@core/parse/style-only';
import { resolveLessSass } from '@plugins/resolve-less-sass';
import { logger } from '@shared/logger';
import { executePlugins } from '@shared/plugin-executor';

jest.mock('@plugins/resolve-less-sass', () => ({
  resolveLessSass: jest.fn(),
}));

jest.mock('@shared/plugin-executor', () => ({
  executePlugins: jest.fn(),
}));

describe('parseOnlyStyle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns parsed style with resolved code and lang', () => {
    (resolveLessSass as unknown as jest.Mock).mockReturnValue({
      code: '/* css */',
      fileExt: '.css',
    });
    const ctx: any = { filename: 'a.css', preprocessStyles: false };
    const res = parseOnlyStyle('some source', ctx, {} as any);
    expect(res.style?.source?.content).toBe('/* css */');
    expect(res.style?.source?.lang).toBe('css');
  });

  test('fallbacks filename without extension and warns', () => {
    (resolveLessSass as unknown as jest.Mock).mockReturnValue({
      code: '/* less */',
      fileExt: '.less',
    });
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const ctx: any = { filename: 'a.', preprocessStyles: true };
    parseOnlyStyle('source', ctx, {} as any);
    expect(warnSpy).toHaveBeenCalled();
    expect(resolveLessSass).toHaveBeenCalledWith('source', {
      filename: 'a.',
      lang: 'css',
      enabled: true,
    });
  });

  test('executePlugins is called with provided plugins', () => {
    (resolveLessSass as unknown as jest.Mock).mockReturnValue({
      code: '/* css */',
      fileExt: '.css',
    });
    const plugins = [() => {}];
    const ctx: any = { filename: 'b.css', preprocessStyles: false };
    parseOnlyStyle('src', ctx, { plugins } as any);
    expect(executePlugins).toHaveBeenCalledWith(plugins, expect.anything(), ctx);
  });
});
