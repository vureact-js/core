import * as t from '@babel/types';
import {
  buildSlotPropSignature,
  createSlotScopeParam,
} from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-props-interface/resolve-slot/slot-builder';

describe('slot-builder', () => {
  test('buildSlotPropSignature creates children for default no-params', () => {
    const sig = buildSlotPropSignature('default', [], false);
    expect(t.isTSPropertySignature(sig)).toBe(true);
    const key = sig.key as any;
    expect(t.isIdentifier(key) ? key.name : key.value).toBe('children');
    expect(sig.optional).toBe(false);
  });

  test('buildSlotPropSignature creates function type for scoped slot', () => {
    const param = t.identifier('p');
    const sig = buildSlotPropSignature('foo', [param], true);
    expect(t.isTSPropertySignature(sig)).toBe(true);
    const key = sig.key as any;
    expect(t.isIdentifier(key) ? key.name : key.value).toBe('foo');
    expect(sig.optional).toBe(true);
    const ta = sig.typeAnnotation as any;
    expect(t.isTSTypeAnnotation(ta)).toBe(true);
    expect(t.isTSFunctionType(ta.typeAnnotation)).toBe(true);
  });

  test('createSlotScopeParam builds param with reactive binding types', () => {
    const props = [
      { prop: 'a', tsType: t.tsTypeAnnotation(t.tsNumberKeyword()) },
      { prop: 'b-c', tsType: t.tsTypeAnnotation(t.tsStringKeyword()) },
    ];

    const ctx: any = { templateData: { reactiveBindings: { a: { value: t.numericLiteral(1) } } } };

    const id = createSlotScopeParam(props as any, ctx as any);
    expect(t.isIdentifier(id)).toBe(true);
    expect(id.typeAnnotation).toBeDefined();
    const ta = id.typeAnnotation as any;
    expect(t.isTSTypeAnnotation(ta)).toBe(true);
    const lit = ta.typeAnnotation as any;
    expect(t.isTSTypeLiteral(lit)).toBe(true);
    const keys = lit.members.map((m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value));
    expect(keys).toEqual(expect.arrayContaining(['a', 'b-c']));
  });
});
