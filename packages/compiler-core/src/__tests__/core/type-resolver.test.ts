import * as t from '@babel/types';
import {
  resolveSlotPropFromMember,
  resolveSlotType,
} from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-props-interface/resolve-slot/type-resolver';

describe('type-resolver', () => {
  test('resolveSlotType with function type returns default children prop', () => {
    const fnType = t.tsFunctionType(null, [], t.tsTypeAnnotation(t.tsVoidKeyword()));
    const options: any = { localTypeDeclarations: new Map(), visitedTypeNames: new Set() };

    const res = resolveSlotType(fnType, options as any);

    expect(res.shouldRecordReactNode).toBe(true);
    expect(t.isTSTypeLiteral(res.type)).toBe(true);

    const members = (res.type as any).members;
    expect(members.length).toBe(1);
    const key = members[0].key;
    expect(t.isIdentifier(key) ? key.name : key.value).toBe('children');
  });

  test('resolveSlotType with object literal containing callable property', () => {
    const fnType = t.tsFunctionType(
      null,
      [t.identifier('p')],
      t.tsTypeAnnotation(t.tsVoidKeyword()),
    );
    const propSig = t.tsPropertySignature(t.identifier('foo'), t.tsTypeAnnotation(fnType));
    const tsLiteral = t.tsTypeLiteral([propSig]);
    const options: any = { localTypeDeclarations: new Map(), visitedTypeNames: new Set() };

    const res = resolveSlotType(tsLiteral, options as any);
    expect(res.shouldRecordReactNode).toBe(true);
    expect(t.isTSTypeLiteral(res.type)).toBe(true);

    const members = (res.type as any).members;
    const key = members[0].key;
    expect(t.isIdentifier(key) ? key.name : key.value).toBe('foo');
  });

  test('resolveSlotPropFromMember handles method signature', () => {
    const method: any = {
      type: 'TSMethodSignature',
      key: t.identifier('bar'),
      parameters: [t.identifier('a')],
    };

    const res = resolveSlotPropFromMember(method as any);
    expect(res.shouldRecordReactNode).toBe(true);
    expect(res.member).not.toBeNull();
    const key = (res.member as any).key;
    expect(t.isIdentifier(key) ? key.name : key.value).toBe('bar');
  });

  test('resolveSlotType with type reference param that is function type', () => {
    const fnType = t.tsFunctionType(
      null,
      [t.identifier('p')],
      t.tsTypeAnnotation(t.tsVoidKeyword()),
    );
    const typeRef = t.tsTypeReference(
      t.identifier('X'),
      t.tsTypeParameterInstantiation([fnType as any]),
    );
    const options: any = { localTypeDeclarations: new Map(), visitedTypeNames: new Set() };

    const res = resolveSlotType(typeRef, options as any);
    expect(res.shouldRecordReactNode).toBe(true);
    expect(t.isTSTypeReference(res.type)).toBe(true);
    const params = (res.type as any).typeParameters.params;
    expect(params.length).toBeGreaterThan(0);
    expect(t.isTSTypeLiteral(params[0])).toBe(true);
  });

  test('resolveSlotType with intersection of callable types returns intersection', () => {
    const fn1 = t.tsFunctionType(null, [t.identifier('a')], t.tsTypeAnnotation(t.tsVoidKeyword()));
    const fn2 = t.tsFunctionType(null, [t.identifier('b')], t.tsTypeAnnotation(t.tsVoidKeyword()));
    const inter = t.tsIntersectionType([fn1 as any, fn2 as any]);
    const options: any = { localTypeDeclarations: new Map(), visitedTypeNames: new Set() };

    const res = resolveSlotType(inter, options as any);
    expect(res.shouldRecordReactNode).toBe(true);
    expect(t.isTSIntersectionType(res.type)).toBe(true);
  });

  test('resolveSlotType with union of callable types returns union', () => {
    const fn1 = t.tsFunctionType(null, [t.identifier('a')], t.tsTypeAnnotation(t.tsVoidKeyword()));
    const fn2 = t.tsFunctionType(null, [t.identifier('b')], t.tsTypeAnnotation(t.tsVoidKeyword()));
    const uni = t.tsUnionType([fn1 as any, fn2 as any]);
    const options: any = { localTypeDeclarations: new Map(), visitedTypeNames: new Set() };

    const res = resolveSlotType(uni, options as any);
    expect(res.shouldRecordReactNode).toBe(true);
    expect(t.isTSUnionType(res.type)).toBe(true);
  });

  test('resolveSlotType with type literal containing call signature yields children prop', () => {
    const callSig: any = { type: 'TSCallSignatureDeclaration', parameters: [t.identifier('x')] };
    const lit = t.tsTypeLiteral([callSig as any]);
    const options: any = { localTypeDeclarations: new Map(), visitedTypeNames: new Set() };

    const res = resolveSlotType(lit, options as any);
    expect(res.shouldRecordReactNode).toBe(true);
    expect(t.isTSTypeLiteral(res.type)).toBe(true);
    const members = (res.type as any).members;
    // default call signature should produce a children prop (default slot)
    const found = members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'children',
    );
    expect(found).toBeDefined();
  });

  test('resolveSlotPropFromMember returns null for unknown member types', () => {
    const unknown: any = { type: 'TSUnknown' };
    const res = resolveSlotPropFromMember(unknown as any);
    expect(res.shouldRecordReactNode).toBe(false);
    expect(res.member).toBeNull();
  });

  test('resolveSlotType detects and avoids recursive local type declarations', () => {
    const localMap = new Map<string, any>();
    // A -> B, B -> A to create recursion
    localMap.set('A', { type: t.tsTypeReference(t.identifier('B')), hasTypeParameters: false });
    localMap.set('B', { type: t.tsTypeReference(t.identifier('A')), hasTypeParameters: false });

    const options: any = { localTypeDeclarations: localMap, visitedTypeNames: new Set() };
    const ref = t.tsTypeReference(t.identifier('A'));

    const res = resolveSlotType(ref, options as any);
    // should not record ReactNode due to recursion protection
    expect(res.shouldRecordReactNode).toBe(false);
    expect(t.isTSTypeReference(res.type)).toBe(true);
  });
});
