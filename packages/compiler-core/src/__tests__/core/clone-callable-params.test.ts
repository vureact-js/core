import * as t from '@babel/types';
import { cloneCallableParams } from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-props-interface/shared';

describe('cloneCallableParams', () => {
  test('clones identifier param preserving optional and typeAnnotation', () => {
    const id = t.identifier('p');
    id.optional = true as any;
    id.typeAnnotation = t.tsTypeAnnotation(t.tsNumberKeyword());

    const res = cloneCallableParams([id as any]);
    expect(res.length).toBe(1);
    const out = res[0] as any;
    expect(t.isIdentifier(out)).toBe(true);
    expect(out.name).toBe('p');
    expect(out.optional).toBe(true);
    expect(t.isTSNumberKeyword(out.typeAnnotation.typeAnnotation)).toBe(true);
  });

  test('clones rest element with identifier argument and produces array type fallback', () => {
    const rest = t.restElement(t.identifier('xs'));
    // no typeAnnotation on rest or arg

    const res = cloneCallableParams([rest as any]);
    expect(res.length).toBe(1);
    const out = res[0] as any;
    expect(t.isRestElement(out)).toBe(true);
    expect(t.isIdentifier(out.argument)).toBe(true);
    expect(out.argument.name).toBe('xs');
    expect(t.isTSTypeAnnotation(out.typeAnnotation)).toBe(true);
    const inner = out.typeAnnotation.typeAnnotation;
    expect(t.isTSArrayType(inner)).toBe(true);
  });

  test('clones rest element with non-identifier argument names it args0', () => {
    const rest = t.restElement(t.arrayPattern([t.identifier('a')]));
    const res = cloneCallableParams([rest as any]);
    const out = res[0] as any;
    expect(t.isRestElement(out)).toBe(true);
    expect(t.isIdentifier(out.argument)).toBe(true);
    expect(out.argument.name).toBe('args0');
  });

  test('pattern fallback becomes argN identifier with any type', () => {
    const pat = t.objectPattern([t.objectProperty(t.identifier('x'), t.identifier('y'))]);
    const res = cloneCallableParams([pat as any]);
    expect(res.length).toBe(1);
    const out = res[0] as any;
    expect(t.isIdentifier(out)).toBe(true);
    expect(out.name).toBe('arg0');
    expect(t.isTSTypeAnnotation(out.typeAnnotation)).toBe(true);
    expect(t.isTSAnyKeyword(out.typeAnnotation.typeAnnotation)).toBe(true);
  });
});
