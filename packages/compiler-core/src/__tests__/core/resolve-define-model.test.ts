import * as t from '@babel/types';
import { PACKAGE_NAME } from '@consts/other';
import { resolveDefineModel } from '@core/transform/sfc/script/syntax-processor/preprocess/resolve-define-model';
import { logger } from '@shared/logger';

describe('resolveDefineModel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('logs error for invalid first argument', () => {
    const call = t.callExpression(t.identifier('defineModel'), [t.numericLiteral(1)]);
    const path: any = { node: call, parentPath: { parentPath: undefined } };

    const ctx: any = {
      inputType: 'sfc',
      filename: 'x',
      scriptData: { source: 's', lang: 'ts', propsTSIface: { propsTypes: [], emitTypes: [] } },
    };

    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    const visitor = resolveDefineModel(ctx, { program: { body: [] } } as any);
    visitor.CallExpression(path as any);

    expect(spy).toHaveBeenCalled();
  });

  test('logs error for unsupported option (get/set/validator)', () => {
    const obj = t.objectExpression([
      t.objectProperty(t.identifier('get'), t.arrowFunctionExpression([], t.blockStatement([]))),
    ]);
    const call = t.callExpression(t.identifier('defineModel'), [obj]);
    const path: any = { node: call, parentPath: { parentPath: undefined } };

    const ctx: any = {
      inputType: 'sfc',
      filename: 'x',
      scriptData: { source: 's', lang: 'ts', propsTSIface: { propsTypes: [], emitTypes: [] } },
    };

    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const visitor = resolveDefineModel(ctx, { program: { body: [] } } as any);
    visitor.CallExpression(path as any);

    expect(spy).toHaveBeenCalled();
  });

  test('logs error when return value is destructured with array pattern', () => {
    const call = t.callExpression(t.identifier('defineModel'), [t.objectExpression([])]);

    const varDeclaration: any = {
      isVariableDeclaration: () => true,
      node: { declarations: [{ id: t.arrayPattern([t.identifier('a')]) }], loc: {} },
    };

    const path: any = { node: call, parentPath: { parentPath: varDeclaration } };

    const ctx: any = {
      inputType: 'sfc',
      filename: 'x',
      scriptData: { source: 's', lang: 'ts', propsTSIface: { propsTypes: [], emitTypes: [] } },
    };

    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const visitor = resolveDefineModel(ctx, { program: { body: [] } } as any);
    visitor.CallExpression(path as any);

    expect(spy).toHaveBeenCalled();
  });

  test('valid object option adds props/emits, replaces call and appends update effect', () => {
    const obj = t.objectExpression([
      t.objectProperty(t.identifier('name'), t.stringLiteral('count')),
      t.objectProperty(t.identifier('type'), t.identifier('Number')),
      t.objectProperty(t.identifier('default'), t.numericLiteral(0)),
      t.objectProperty(t.identifier('required'), t.booleanLiteral(true)),
    ]);

    const call = t.callExpression(t.identifier('defineModel'), [obj]);

    const path: any = {
      node: call,
      parent: t.variableDeclarator(t.identifier('model'), call),
      parentPath: { parentPath: { isVariableDeclaration: () => false } },
    };

    const ast: any = { program: { body: [] } };

    const ctx: any = {
      inputType: 'sfc',
      filename: 'f',
      propField: 'props',
      imports: new Map<string, any>(),
      scriptData: { lang: 'ts', propsTSIface: { propsTypes: [], emitTypes: [] }, source: 's' },
    };

    const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    const visitor = resolveDefineModel(ctx, ast as any);
    visitor.CallExpression(path as any);

    // call name should be replaced to runtime ref adapter target
    expect(t.isIdentifier(call.callee) && (call.callee as any).name === 'useVRef').toBe(true);

    // arguments should contain logical expression because default exists
    expect(call.arguments && call.arguments.length > 0).toBe(true);
    expect(t.isLogicalExpression(call.arguments[0] as any)).toBe(true);

    // type parameter should be injected (Number -> TSNumberKeyword)
    expect(call.typeParameters).toBeDefined();
    // props and emits appended
    expect(ctx.scriptData.propsTSIface.propsTypes.length).toBeGreaterThan(0);
    expect(ctx.scriptData.propsTSIface.emitTypes.length).toBeGreaterThan(0);

    const propsLit: any = ctx.scriptData.propsTSIface.propsTypes[0];
    const foundProp = (propsLit.members || []).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'count',
    );
    expect(foundProp).toBeDefined();

    const emitsLit: any = ctx.scriptData.propsTSIface.emitTypes[0];
    const foundEmit = (emitsLit.members || []).find(
      (m: any) => (t.isIdentifier(m.key) ? m.key.name : m.key.value) === 'onUpdateCount',
    );
    expect(foundEmit).toBeDefined();

    // effect appended to ast
    expect(ast.program.body.length).toBeGreaterThan(0);

    // imports recorded for runtime adapters
    expect(ctx.imports.has(PACKAGE_NAME.runtime)).toBe(true);
    const list = ctx.imports.get(PACKAGE_NAME.runtime) as any[];
    expect(list.find((i) => i.name === 'useVRef' || i.name === 'useUpdated')).toBeDefined();

    // logger.error should not have been called for the successful path
    expect(spy).not.toHaveBeenCalled();
  });
});
