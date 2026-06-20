import * as propIR from '@core/transform/sfc/template/shared/prop-ir-utils';
import { logger } from '@shared/logger';
import * as strTypes from '@shared/string-code-types';
import { PropTypes } from '@transform/sfc/template/shared/types';

describe('prop-ir-utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('createPropsIR returns expected structure and uses rawName', () => {
    const res = propIR.createPropsIR('data-id', 'data-id', '42');
    expect(res.rawName).toBe('data-id');
    expect(res.name).toBe('data-id');
    expect(res.value.content).toBe('42');
  });

  test('normalizePropName handles special cases and camel-casing', () => {
    expect(propIR.normalizePropName('raw', 'v-html')).toBe('dangerouslySetInnerHTML');
    expect(propIR.normalizePropName('raw', 'class')).toBe('className');
    expect(propIR.normalizePropName('v-for', 'for')).toBe('for');
    expect(propIR.normalizePropName('raw', 'data-id')).toBe('data-id');
    expect(propIR.normalizePropName(':raw', 'my-prop')).toBe('myProp');
  });

  test('normalizeValue wraps non-literals when static', () => {
    jest.spyOn(strTypes.strCodeTypes, 'isStringLiteral').mockReturnValue(false);
    expect(propIR.normalizeValue('abc', true)).toBe("'abc'");

    jest.spyOn(strTypes.strCodeTypes, 'isStringLiteral').mockReturnValue(true);
    expect(propIR.normalizeValue("'abc'", false)).toBe("'abc'");
  });

  test('isV* helpers and attr/style checks', () => {
    expect(propIR.isVOn('@click')).toBe(true);
    expect(propIR.isVOn('v-on:click')).toBe(true);
    expect(propIR.isVSlot('#slot')).toBe(true);
    expect(propIR.isVBind(':style')).toBe(true);
    expect(propIR.isVModel('v-model')).toBe(true);
    expect(propIR.isClassAttr('class')).toBe(true);
    expect(propIR.isStyleAttr('style')).toBe(true);
    expect(propIR.isVConditional('v-if')).toBe(true);
  });

  test('findSameProp finds matching prop by name', () => {
    const source = [
      { isStatic: true, type: PropTypes.ATTRIBUTE, name: 'id' },
      { isStatic: true, type: PropTypes.ATTRIBUTE, name: 'other' },
    ];
    const target = { isStatic: true, type: PropTypes.ATTRIBUTE, name: 'id' };

    const found = propIR.findSameProp(source as any, target as any);
    expect(found).toBe(source[0]);
  });

  test('wrapSingleQuotes respects condition and string-literal detection', () => {
    jest.spyOn(strTypes.strCodeTypes, 'isStringLiteral').mockReturnValue(false);
    expect(propIR.wrapSingleQuotes('x', true)).toBe("'x'");

    jest.spyOn(strTypes.strCodeTypes, 'isStringLiteral').mockReturnValue(true);
    expect(propIR.wrapSingleQuotes('y')).toBe("'y'");
  });

  test('checkPropIsDynamicKey logs warnings for keyless v-bind and dynamic names', () => {
    const spy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const ctx: any = { source: 's', filename: 'f' };

    // keyless v-bind
    const node1: any = { rawName: 'v-bind' };
    propIR.checkPropIsDynamicKey(ctx, node1);
    expect(spy).toHaveBeenCalled();

    spy.mockClear();

    // dynamic slot name
    const node2: any = { rawName: 'v-slot', arg: { isStatic: false, loc: {} } };
    propIR.checkPropIsDynamicKey(ctx, node2);
    expect(spy).toHaveBeenCalled();
  });

  test('addKeyToNodeIR pushes a key prop', () => {
    const node: any = { props: [] };
    const ctx: any = {
      scriptData: { lang: 'js' },
      templateData: { reactiveBindings: [] },
      imports: new Map(),
    };

    propIR.addKeyToNodeIR(node, null as any, ctx);

    expect(node.props.length).toBe(1);
    expect(node.props[0].name).toBe('key');
  });
});
