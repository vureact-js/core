import * as proc from '@core/transform/sfc/template/syntax-processor/process/props';
import { resolveDirectiveProp } from '@core/transform/sfc/template/syntax-processor/process/props/resolve-directive-prop';
import * as warnUtils from '@transform/sfc/template/shared/warning-utils';

describe('resolveDirectiveProp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('warns on unsupported directive', () => {
    const spy = jest.spyOn(warnUtils, 'warnUnsupportedDirective').mockImplementation(() => {});

    const directive: any = { name: 'unknown', rawName: 'v-unknown', loc: {} };
    const res = resolveDirectiveProp(
      directive as any,
      {} as any,
      { source: '' } as any,
      {} as any,
      {} as any,
      [] as any,
    );

    expect(spy).toHaveBeenCalledWith(expect.anything(), directive.loc, directive.rawName);
    expect(res).toBeUndefined();
  });

  test('v-html calls resolveVHtml and returns true', () => {
    const spy = jest.spyOn(proc, 'resolveVHtml').mockImplementation(() => {});

    const directive: any = { name: 'html', rawName: 'v-html', loc: {} };

    const res = resolveDirectiveProp(
      directive as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      [] as any,
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(res).toBe(true);
  });

  test('v-text calls resolveVText', () => {
    const spy = jest.spyOn(proc, 'resolveVText').mockImplementation(() => {});

    const directive: any = { name: 'text', rawName: 'v-text', loc: {} };

    resolveDirectiveProp(directive as any, {} as any, {} as any, {} as any, {} as any, [] as any);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('v-for calls resolveVFor', () => {
    const spy = jest.spyOn(proc, 'resolveVFor').mockImplementation(() => {});

    const directive: any = { name: 'for', rawName: 'v-for', loc: {} };

    resolveDirectiveProp(directive as any, {} as any, {} as any, {} as any, {} as any, [] as any);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('v-slot with RouterLink calls resolveRouterLinkVSlotProp', () => {
    const spy = jest.spyOn(proc, 'resolveRouterLinkVSlotProp').mockImplementation(() => {});

    const directive: any = { name: 'slot', rawName: 'v-slot', loc: {} };
    const nodeIR: any = { tag: 'RouterLink' };

    resolveDirectiveProp(
      directive as any,
      {} as any,
      {} as any,
      { tag: 'div' } as any,
      nodeIR as any,
      [] as any,
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
