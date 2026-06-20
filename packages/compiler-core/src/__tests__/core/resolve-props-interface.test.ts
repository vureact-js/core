import * as t from '@babel/types';
import { resolveDefinePropsIface } from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-props-interface/resolve-props';
import { logger } from '@shared/logger';

describe('resolveDefinePropsIface', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('processes array runtimeArg into propsTypes', () => {
    const runtimeArg = t.arrayExpression([t.stringLiteral('foo')]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    expect(ctx.scriptData.propsTSIface.propsTypes.length).toBeGreaterThan(0);
  });

  test('processes object runtimeArg into propsTypes with required flag', () => {
    const propValue = t.objectExpression([
      t.objectProperty(t.identifier('type'), t.identifier('String')),
      t.objectProperty(t.identifier('required'), t.booleanLiteral(true)),
    ]);

    const runtimeArg = t.objectExpression([t.objectProperty(t.identifier('a'), propValue)]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    expect(ctx.scriptData.propsTSIface.propsTypes.length).toBeGreaterThan(0);
  });

  test('logs error for unsupported runtimeArg', () => {
    const runtimeArg = t.identifier('foo');
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };
    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    resolveDefinePropsIface(fakePath, ctx);

    expect(spy).toHaveBeenCalled();
  });

  test('object runtimeArg with direct identifier type maps to Number', () => {
    const runtimeArg = t.objectExpression([
      t.objectProperty(t.identifier('a'), t.identifier('Number')),
    ]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSNumberKeyword(ta)).toBe(true);
  });

  test('object runtimeArg with array type produces union type', () => {
    const arr = t.arrayExpression([t.identifier('String'), t.identifier('Number')]);
    const runtimeArg = t.objectExpression([t.objectProperty(t.identifier('a'), arr)]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSUnionType(ta)).toBe(true);
    expect(ta.types.length).toBe(2);
  });

  test('numeric literal key becomes string key and empty array type -> any', () => {
    const arr = t.arrayExpression([]);
    const runtimeArg = t.objectExpression([t.objectProperty(t.numericLiteral(123), arr)]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const key = member.key;
    expect(t.isStringLiteral(key) && key.value === '123').toBe(true);
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSAnyKeyword(ta)).toBe(true);
  });

  test('object runtimeArg with identifier Function maps to TSFunctionType', () => {
    const runtimeArg = t.objectExpression([
      t.objectProperty(t.identifier('a'), t.identifier('Function')),
    ]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSFunctionType(ta)).toBe(true);
  });

  test('object runtimeArg with identifier Array maps to TSArrayType', () => {
    const runtimeArg = t.objectExpression([
      t.objectProperty(t.identifier('a'), t.identifier('Array')),
    ]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSArrayType(ta)).toBe(true);
    expect(t.isTSAnyKeyword(ta.elementType)).toBe(true);
  });

  test('object runtimeArg with identifier Object maps to TSTypeLiteral', () => {
    const runtimeArg = t.objectExpression([
      t.objectProperty(t.identifier('a'), t.identifier('Object')),
    ]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSTypeLiteral(ta)).toBe(true);
  });

  test('object runtimeArg Symbol and BigInt map to symbol and bigint keywords', () => {
    const runtimeArg = t.objectExpression([
      t.objectProperty(t.identifier('s'), t.identifier('Symbol')),
      t.objectProperty(t.identifier('b'), t.identifier('BigInt')),
    ]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const symbolMember = pushed.members.find(
      (m: any) => t.isIdentifier(m.key) && m.key.name === 's',
    );
    const bigintMember = pushed.members.find(
      (m: any) => t.isIdentifier(m.key) && m.key.name === 'b',
    );
    expect(t.isTSSymbolKeyword(symbolMember.typeAnnotation.typeAnnotation)).toBe(true);
    expect(t.isTSBigIntKeyword(bigintMember.typeAnnotation.typeAnnotation)).toBe(true);
  });

  test('unknown identifier maps to any keyword', () => {
    const runtimeArg = t.objectExpression([
      t.objectProperty(t.identifier('x'), t.identifier('Custom')),
    ]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    expect(t.isTSAnyKeyword(member.typeAnnotation.typeAnnotation)).toBe(true);
  });

  test('array type with single identifier returns single type (not union)', () => {
    const arr = t.arrayExpression([t.identifier('Number')]);
    const runtimeArg = t.objectExpression([t.objectProperty(t.identifier('a'), arr)]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSNumberKeyword(ta)).toBe(true);
  });

  test('array type with non-identifier elements filters them out', () => {
    const arr = t.arrayExpression([t.stringLiteral('a'), t.identifier('Number')]);
    const runtimeArg = t.objectExpression([t.objectProperty(t.identifier('a'), arr)]);
    const fakePath: any = { node: { arguments: [runtimeArg], typeParameters: undefined } };
    const ctx: any = {
      filename: 'x',
      scriptData: { source: 's', propsTSIface: { propsTypes: [] } },
    };

    resolveDefinePropsIface(fakePath, ctx);

    const pushed = ctx.scriptData.propsTSIface.propsTypes[0] as any;
    const member = pushed.members[0] as any;
    const ta = member.typeAnnotation.typeAnnotation;
    expect(t.isTSNumberKeyword(ta)).toBe(true);
  });
});
