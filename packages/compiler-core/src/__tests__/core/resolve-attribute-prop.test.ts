import { resolveAttributeProp } from '@core/transform/sfc/template/syntax-processor/process/props/resolve-attribute-prop';
import * as dynMod from '@core/transform/sfc/template/syntax-processor/process/props/resolve-dynamic-attribute-prop';
import * as isMod from '@core/transform/sfc/template/syntax-processor/process/props/resolve-is-prop';
import * as refMod from '@core/transform/sfc/template/syntax-processor/process/props/resolve-ref-prop';

describe('resolveAttributeProp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('handles is attribute by delegating to resolveStaticIsProp', () => {
    const spy = jest.spyOn(isMod, 'resolveStaticIsProp').mockImplementation(() => {});

    const attr: any = { name: 'is', value: { content: 'comp' } };

    resolveAttributeProp(attr as any, {} as any, {} as any, {} as any);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('handles ref attribute by delegating to resolveRefProp', () => {
    const spy = jest.spyOn(refMod, 'resolveRefProp').mockImplementation(() => {});

    const attr: any = { name: 'ref', value: { content: '' } };

    resolveAttributeProp(attr as any, {} as any, {} as any, {} as any);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('creates attr IR and calls resolvePropertyIR for generic attribute', () => {
    const spy = jest.spyOn(dynMod, 'resolvePropertyIR').mockImplementation(() => {});

    const attr: any = { name: 'data-id', value: { content: '42' } };

    resolveAttributeProp(attr as any, {} as any, {} as any, {} as any);

    expect(spy).toHaveBeenCalledTimes(1);
    const firstArg = spy.mock.calls[0][0];
    expect(firstArg).toHaveProperty('rawName', 'data-id');
    expect(firstArg.value.isStringLiteral).toBe(true);
  });
});
