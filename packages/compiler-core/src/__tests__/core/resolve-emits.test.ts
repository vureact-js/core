import * as t from '@babel/types';
import {
  resolveDefineEmitsIface,
  resolveEmitsTopLevelTypes,
} from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-props-interface/resolve-emits';

describe('resolve-emits (runtime inference)', () => {
  test('infer from array runtime argument', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const call = t.callExpression(t.identifier('defineEmits'), [
      t.arrayExpression([t.stringLiteral('change')]),
    ]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0];
    expect(t.isTSTypeLiteral(lit)).toBe(true);

    const member = (lit as any).members[0];
    const key = member.key;
    if (t.isIdentifier(key)) {
      expect(key.name).toBe('onChange');
    } else {
      expect(key.value).toBe('onChange');
    }
  });

  test('infer from object runtime argument with tuple param', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const propValue = t.arrayExpression([t.identifier('value')]);
    const prop = t.objectProperty(t.identifier('update'), propValue);
    const call = t.callExpression(t.identifier('defineEmits'), [t.objectExpression([prop])]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0];

    const found = (lit as any).members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onUpdate',
    );
    expect(found).toBeDefined();
  });
});

describe('resolve-emits (explicit types and top-level)', () => {
  test('explicit function type parameter with union event names', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(
      t.tsUnionType([
        t.tsLiteralType(t.stringLiteral('foo')),
        t.tsLiteralType(t.stringLiteral('bar')),
      ]),
    );

    const fnType = t.tsFunctionType(null, [eventId], t.tsTypeAnnotation(t.tsVoidKeyword()));

    const call = t.callExpression(t.identifier('defineEmits'), []);
    // attach explicit TS type parameter
    (call as any).typeParameters = t.tsTypeParameterInstantiation([fnType as any]);

    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const names = lit.members.map((m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value));
    expect(names).toEqual(expect.arrayContaining(['onFoo', 'onBar']));
  });

  test('explicit literal property signature transforms to onX property', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const id = t.identifier('value');
    id.typeAnnotation = t.tsTypeAnnotation(t.tsNumberKeyword());
    const fnType = t.tsFunctionType(null, [id], t.tsTypeAnnotation(t.tsVoidKeyword()));

    const prop = t.tsPropertySignature(t.identifier('save'), t.tsTypeAnnotation(fnType));
    const typeLit = t.tsTypeLiteral([prop]);

    const call = t.callExpression(t.identifier('defineEmits'), []);
    (call as any).typeParameters = t.tsTypeParameterInstantiation([typeLit as any]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const found = lit.members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onSave',
    );
    expect(found).toBeDefined();
  });

  test('top-level interface conversion replaces call signature with props', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));

    const callSig: any = {
      type: 'TSCallSignatureDeclaration',
      parameters: [eventId],
      typeAnnotation: t.tsTypeAnnotation(t.tsVoidKeyword()),
    };

    const node: any = {
      type: 'TSInterfaceDeclaration',
      id: t.identifier('I'),
      body: { type: 'TSInterfaceBody', body: [callSig] },
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const members = node.body.body as any[];
    expect(members.length).toBeGreaterThan(0);
    const found = members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('explicit property tuple type maps to function params on handler', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const tuple = t.tsTupleType([t.tsStringKeyword(), t.tsNumberKeyword()]);
    const prop = t.tsPropertySignature(t.identifier('update'), t.tsTypeAnnotation(tuple));
    const typeLit = t.tsTypeLiteral([prop]);

    const call = t.callExpression(t.identifier('defineEmits'), []);
    (call as any).typeParameters = t.tsTypeParameterInstantiation([typeLit as any]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const found = lit.members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onUpdate',
    );
    expect(found).toBeDefined();

    const fnType = found.typeAnnotation.typeAnnotation as any;
    expect(t.isTSFunctionType(fnType)).toBe(true);
    const params = fnType.parameters;
    expect(params.length).toBe(2);
    const p0 = params[0] as any;
    const p1 = params[1] as any;
    expect(p0.typeAnnotation && t.isTSStringKeyword(p0.typeAnnotation.typeAnnotation)).toBe(true);
    expect(p1.typeAnnotation && t.isTSNumberKeyword(p1.typeAnnotation.typeAnnotation)).toBe(true);
  });

  test('explicit TSTypeReference with nested params preserves non-emits when none present', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    // T<TypeA<number>> where inner type has no emits callable
    const inner = t.tsTypeReference(
      t.identifier('TypeA'),
      t.tsTypeParameterInstantiation([t.tsNumberKeyword() as any]),
    );
    const outer = t.tsTypeReference(
      t.identifier('Wrapper'),
      t.tsTypeParameterInstantiation([inner as any]),
    );

    const call = t.callExpression(t.identifier('defineEmits'), []);
    (call as any).typeParameters = t.tsTypeParameterInstantiation([outer as any]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    // explicit non-emits types are still pushed as resolved types
    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const pushed = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    expect(t.isTSTypeReference(pushed)).toBe(true);
    expect(t.isIdentifier(pushed.typeName) && pushed.typeName.name === 'Wrapper').toBe(true);
    const params = pushed.typeParameters && pushed.typeParameters.params;
    expect(params && params.length === 1).toBe(true);
    const innerParam = params[0] as any;
    expect(
      t.isTSTypeReference(innerParam) &&
        t.isIdentifier(innerParam.typeName) &&
        innerParam.typeName.name === 'TypeA',
    ).toBe(true);
  });

  test('runtime object with spread and non-string keys ignored', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const prop1 = t.objectProperty(t.numericLiteral(123), t.arrayExpression([t.identifier('v')]));
    const prop2 = t.spreadElement(t.identifier('rest'));
    const call = t.callExpression(t.identifier('defineEmits'), [
      t.objectExpression([prop1, prop2]),
    ]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const found = lit.members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'on123',
    );
    expect(found).toBeDefined();
  });

  test('top-level TSTypeReference with typeParameters containing call signature is transformed', () => {
    const ctx: any = {};

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));

    const callSig: any = {
      type: 'TSCallSignatureDeclaration',
      parameters: [eventId],
      typeAnnotation: t.tsTypeAnnotation(t.tsVoidKeyword()),
    };

    const inner: any = { type: 'TSTypeLiteral', members: [callSig] };

    const typeRef = t.tsTypeReference(
      t.identifier('Wrapper'),
      t.tsTypeParameterInstantiation([inner as any]),
    );

    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('TRef'),
      typeAnnotation: typeRef,
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx as any);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    expect(t.isTSTypeReference(ta)).toBe(true);
    const param = ta.typeParameters.params[0] as any;
    expect(t.isTSTypeLiteral(param)).toBe(true);
    const found = (param.members as any[]).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('top-level union type containing call signature resolves inner param', () => {
    const ctx: any = {};

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));
    const callSig: any = {
      type: 'TSCallSignatureDeclaration',
      parameters: [eventId],
      typeAnnotation: t.tsTypeAnnotation(t.tsVoidKeyword()),
    };
    const inner: any = { type: 'TSTypeLiteral', members: [callSig] };

    const union = t.tsUnionType([inner as any, t.tsNumberKeyword()]);
    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('TU'),
      typeAnnotation: union,
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx as any);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    expect(t.isTSUnionType(ta)).toBe(true);
    const lit = (ta.types as any[]).find((x: any) => t.isTSTypeLiteral(x));
    expect(lit).toBeDefined();
    const found = (lit.members as any[]).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('top-level intersection type containing call signature resolves inner param', () => {
    const ctx: any = {};

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));
    const callSig: any = {
      type: 'TSCallSignatureDeclaration',
      parameters: [eventId],
      typeAnnotation: t.tsTypeAnnotation(t.tsVoidKeyword()),
    };
    const inner: any = { type: 'TSTypeLiteral', members: [callSig] };

    const inter = t.tsIntersectionType([inner as any, t.tsNumberKeyword()]);
    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('TI'),
      typeAnnotation: inter,
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx as any);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    expect(t.isTSIntersectionType(ta)).toBe(true);
    const lit = (ta.types as any[]).find((x: any) => t.isTSTypeLiteral(x));
    expect(lit).toBeDefined();
    const found = (lit.members as any[]).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('top-level function type alias conversion to props', () => {
    const ctx: any = {};

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));

    const val = t.identifier('v');
    const fnType = t.tsFunctionType(null, [eventId, val], t.tsTypeAnnotation(t.tsVoidKeyword()));

    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('TFn'),
      typeAnnotation: fnType,
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx as any);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    expect(t.isTSTypeLiteral(ta)).toBe(true);
    const found = (ta.members as any[]).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('explicit property non-function type maps to single value param', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const prop = t.tsPropertySignature(
      t.identifier('save'),
      t.tsTypeAnnotation(t.tsNumberKeyword()),
    );
    const typeLit = t.tsTypeLiteral([prop]);

    const call = t.callExpression(t.identifier('defineEmits'), []);
    (call as any).typeParameters = t.tsTypeParameterInstantiation([typeLit as any]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);
    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const found = lit.members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onSave',
    );
    expect(found).toBeDefined();

    const fnType = found.typeAnnotation.typeAnnotation as any;
    expect(t.isTSFunctionType(fnType)).toBe(true);
    const params = fnType.parameters;
    expect(params.length).toBe(1);
    const p0 = params[0] as any;
    expect(t.isIdentifier(p0)).toBe(true);
    expect(p0.name).toBe('value');
    expect(p0.typeAnnotation && t.isTSNumberKeyword(p0.typeAnnotation.typeAnnotation)).toBe(true);
  });

  test('runtime object tuple with spread and as-expression maps to appropriate params', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const arr = t.arrayExpression([
      t.spreadElement(t.identifier('rest')),
      t.tsAsExpression(t.identifier('v'), t.tsNumberKeyword()),
      t.nullLiteral(),
    ]);

    const prop = t.objectProperty(t.identifier('event'), arr);
    const call = t.callExpression(t.identifier('defineEmits'), [t.objectExpression([prop])]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const found = lit.members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onEvent',
    );
    expect(found).toBeDefined();

    const fnType = found.typeAnnotation.typeAnnotation as any;
    const params = fnType.parameters;
    expect(params.length).toBe(3);

    const p0 = params[0];
    expect(t.isRestElement(p0)).toBe(true);
    const p1 = params[1] as any;
    expect(t.isIdentifier(p1)).toBe(true);
    expect(p1.typeAnnotation && t.isTSNumberKeyword(p1.typeAnnotation.typeAnnotation)).toBe(true);
    const p2 = params[2] as any;
    expect(t.isIdentifier(p2)).toBe(true);
    expect(p2.name).toBe('arg2');
    expect(p2.typeAnnotation && t.isTSAnyKeyword(p2.typeAnnotation.typeAnnotation)).toBe(true);
  });

  test('top-level type alias conversion replaces call signature with props', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));

    const callSig: any = {
      type: 'TSCallSignatureDeclaration',
      parameters: [eventId],
      typeAnnotation: t.tsTypeAnnotation(t.tsVoidKeyword()),
    };

    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('T'),
      typeAnnotation: { type: 'TSTypeLiteral', members: [callSig] },
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    const members = ta.members as any[];
    expect(members.length).toBeGreaterThan(0);
    const found = members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('parenthesized top-level type resolves inner call signature', () => {
    const ctx: any = {};

    const eventId = t.identifier('e');
    eventId.typeAnnotation = t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral('change')));

    const callSig: any = {
      type: 'TSCallSignatureDeclaration',
      parameters: [eventId],
      typeAnnotation: t.tsTypeAnnotation(t.tsVoidKeyword()),
    };

    const paren = t.tsParenthesizedType({ type: 'TSTypeLiteral', members: [callSig] } as any);

    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('TP'),
      typeAnnotation: paren,
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx as any);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    // should be resolved to a TSTypeLiteral
    expect(t.isTSTypeLiteral(ta)).toBe(true);
    const found = (ta.members as any[]).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onChange',
    );
    expect(found).toBeDefined();
  });

  test('TSTypeReference without typeParameters is unchanged', () => {
    const ctx: any = {};
    const typeRef = t.tsTypeReference(t.identifier('NoParams'));
    const node: any = {
      type: 'TSTypeAliasDeclaration',
      id: t.identifier('TN'),
      typeAnnotation: typeRef,
    };
    const path: any = { node, parent: t.program([]) };

    const visitor = resolveEmitsTopLevelTypes(ctx as any);
    visitor['TSInterfaceDeclaration|TSTypeAliasDeclaration'](path as any);

    const ta = node.typeAnnotation as any;
    expect(t.isTSTypeReference(ta)).toBe(true);
  });

  test('explicit function type with missing event param type produces no emit types', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const fnType = t.tsFunctionType(
      null,
      [t.identifier('e')],
      t.tsTypeAnnotation(t.tsVoidKeyword()),
    );
    const call = t.callExpression(t.identifier('defineEmits'), []);
    (call as any).typeParameters = t.tsTypeParameterInstantiation([fnType as any]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBe(0);
  });

  test('explicit tuple type with rest and optional elements maps correctly', () => {
    const ctx: any = { scriptData: { propsTSIface: { emitTypes: [] } } };

    const tuple = t.tsTupleType([
      t.tsStringKeyword(),
      t.tsRestType(t.tsNumberKeyword()),
      t.tsOptionalType(t.tsBooleanKeyword()),
    ] as any);

    const prop = t.tsPropertySignature(t.identifier('mixed'), t.tsTypeAnnotation(tuple));
    const typeLit = t.tsTypeLiteral([prop]);

    const call = t.callExpression(t.identifier('defineEmits'), []);
    (call as any).typeParameters = t.tsTypeParameterInstantiation([typeLit as any]);
    const path: any = { node: call };

    resolveDefineEmitsIface(path, ctx);

    const lit = ctx.scriptData.propsTSIface.emitTypes[0] as any;
    const found = lit.members.find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onMixed',
    );
    expect(found).toBeDefined();

    const fnType = found.typeAnnotation.typeAnnotation as any;
    const params = fnType.parameters;
    expect(params.length).toBe(3);

    const p0 = params[0] as any;
    expect(t.isIdentifier(p0)).toBe(true);
    expect(p0.typeAnnotation && t.isTSStringKeyword(p0.typeAnnotation.typeAnnotation)).toBe(true);

    const p1 = params[1] as any;
    expect(t.isRestElement(p1)).toBe(true);
    expect(p1.typeAnnotation && t.isTSNumberKeyword(p1.typeAnnotation.typeAnnotation)).toBe(true);

    const p2 = params[2] as any;
    expect(t.isIdentifier(p2)).toBe(true);
    expect(p2.optional).toBe(true);
    expect(p2.typeAnnotation && t.isTSBooleanKeyword(p2.typeAnnotation.typeAnnotation)).toBe(true);
  });
});
