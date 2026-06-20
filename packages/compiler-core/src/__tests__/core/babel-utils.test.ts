import * as t from '@babel/types';
import {
  cleanNodeComments,
  cleanNodeLoc,
  expressionToTSType,
  forkNode,
  isCalleeNamed,
  replaceCallName,
  replaceIdName,
  replaceNode,
} from '@core/transform/sfc/script/shared/babel-utils';

describe('core/babel-utils', () => {
  test('expressionToTSType handles primitives and arrays', () => {
    const s = expressionToTSType(t.stringLiteral('a'));
    expect(s.type).toBe('TSStringKeyword');

    const n = expressionToTSType(t.numericLiteral(1));
    expect(n.type).toBe('TSNumberKeyword');

    const b = expressionToTSType(t.booleanLiteral(true));
    expect(b.type).toBe('TSBooleanKeyword');

    const arr = expressionToTSType(t.arrayExpression([t.numericLiteral(1)]));
    expect(arr.type).toBe('TSArrayType');
  });

  test('findRootIdentifier / findRootVariablePath / getVariableDeclaratorPath', () => {
    const mem = t.memberExpression(t.identifier('a'), t.identifier('b'));
    const fakeBindingPath: any = { isVariableDeclarator: () => true };
    const fakeScope: any = { getBinding: (name: string) => ({ path: fakeBindingPath }) };

    const fakePath: any = { node: mem, scope: fakeScope };

    // findRootIdentifier
    const root = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).findRootIdentifier(mem);
    expect(root && root.name).toBe('a');

    // findRootVariablePath should return the fake binding path
    const rootVar = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).findRootVariablePath(fakePath);
    expect(rootVar).toBe(fakeBindingPath);
  });

  test('checkIsCallExpInAnyCallback detects callback argument', () => {
    const fnNode: any = t.arrowFunctionExpression([], t.blockStatement([]));
    const callNode: any = t.callExpression(t.identifier('c'), [fnNode]);

    const funcPath: any = {
      node: fnNode,
      isFunctionDeclaration: () => false,
      isFunctionExpression: () => false,
      isArrowFunctionExpression: () => true,
      parentPath: null as any,
    };

    const callPath: any = { node: callNode, isCallExpression: () => true, arguments: [fnNode] };

    funcPath.parentPath = callPath;

    const startPath: any = { parentPath: funcPath };

    const res = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).checkIsCallExpInAnyCallback(startPath);
    expect(res).toBe(true);
  });

  test('isVariableDeclTopLevel works for program and parent program', () => {
    const varDecPath: any = { parentPath: { isProgram: () => true } };
    const res1 = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).isVariableDeclTopLevel(varDecPath);
    expect(res1).toBe(true);

    const nestedVarDecPath: any = {
      parentPath: { isProgram: () => false, parentPath: { isProgram: () => true } },
    };
    const res2 = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).isVariableDeclTopLevel(nestedVarDecPath);
    expect(res2).toBe(true);
  });

  test('isIdentifierAccess / isRealVariableAccess / isPropertyName', () => {
    const id = t.identifier('X');
    const pathNoBinding: any = {
      node: id,
      scope: { getBinding: () => undefined },
      parentPath: null,
    };
    const access = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).isIdentifierAccess(pathNoBinding);
    expect(access).toBe(true);

    // binding that points to same identifier => declaration
    const binding = { identifier: id };
    const pathWithBinding: any = {
      node: id,
      scope: { getBinding: () => binding },
      parentPath: null,
    };
    const access2 = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).isIdentifierAccess(pathWithBinding);
    expect(access2).toBe(false);

    // property name
    const propPath: any = {
      parentPath: {
        isObjectProperty: () => true,
        isClassProperty: () => false,
        isMemberExpression: () => false,
        node: { key: id },
      },
    };
    const isProp = (require('@core/transform/sfc/script/shared/babel-utils') as any).isPropertyName(
      { parentPath: propPath.parentPath, node: id } as any,
    );
    expect(isProp).toBe(true);

    const realAccess = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).isRealVariableAccess(pathNoBinding);
    expect(realAccess).toBe(true);
  });

  test('resolveObjectToTSType and stringValueToTSType', () => {
    const ctx: any = { filename: '', scriptData: { lang: 'ts' } };
    const obj = { title: "'name'", count: '1', text: 'greetingMessage', fn: '() => 1' };

    const tlit = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).resolveObjectToTSType(ctx, obj);

    const memberNames = (tlit.members || []).map((m: any) =>
      m.key.name ? m.key.name : m.key.value,
    );
    expect(memberNames).toEqual(expect.arrayContaining(['title', 'count', 'text', 'fn']));
  });

  test('isSimpleLiteral returns expected booleans', () => {
    const isSimple = (
      require('@core/transform/sfc/script/shared/babel-utils') as any
    ).isSimpleLiteral(t.stringLiteral('s'));
    expect(isSimple).toBe(true);

    const isNot = (require('@core/transform/sfc/script/shared/babel-utils') as any).isSimpleLiteral(
      null,
    );
    expect(isNot).toBe(false);
  });

  test('expressionToTSType handles object expressions and functions', () => {
    const obj = t.objectExpression([
      t.objectProperty(t.identifier('title'), t.stringLiteral('x')),
      t.objectProperty(t.identifier('count'), t.numericLiteral(2)),
    ]);

    const res = expressionToTSType(obj);
    expect(res.type).toBe('TSTypeLiteral');
    // two members created
    // @ts-ignore
    expect((res.members || []).length).toBeGreaterThanOrEqual(2);

    const fnExpr = t.arrowFunctionExpression(
      [t.identifier('a')],
      t.blockStatement([t.returnStatement(t.numericLiteral(3))]),
    );

    const fnType = expressionToTSType(fnExpr);
    expect(fnType.type).toBe('TSFunctionType');
  });

  test('isCalleeNamed / replaceCallName / replaceIdName', () => {
    const call = t.callExpression(t.identifier('oldName'), []);
    expect(isCalleeNamed(call, 'oldName')).toBe(true);

    replaceCallName(call, 'newName');
    // @ts-ignore
    expect((call.callee as any).name).toBe('newName');

    const id = t.identifier('i');
    // @ts-ignore
    id.loc = { identifierName: 'i' };
    replaceIdName(id, 'j');
    expect(id.name).toBe('j');
    // @ts-ignore
    expect(id.loc && (id.loc as any).identifierName).toBe('j');
  });

  test('forkNode / cleanNodeLoc / cleanNodeComments / replaceNode', () => {
    const node = t.identifier('a');
    // @ts-ignore
    node.start = 1;
    // @ts-ignore
    node.end = 2;
    // @ts-ignore
    node.loc = { foo: true };
    // @ts-ignore
    node.leadingComments = [{ type: 'CommentLine', value: 'l' }];
    // @ts-ignore
    node.innerComments = [{ type: 'CommentBlock', value: 'i' }];

    const forked = forkNode(node);
    // forked should inherit comments
    // @ts-ignore
    expect(forked.leadingComments).toBeDefined();
    // original node loc should be cleared
    // @ts-ignore
    expect(node.start).toBeNull();

    // cleanNodeLoc / cleanNodeComments
    const n2 = t.identifier('b');
    // @ts-ignore
    n2.start = 10;
    cleanNodeLoc(n2);
    // @ts-ignore
    expect(n2.start).toBeNull();

    // comments
    // @ts-ignore
    n2.leadingComments = [{ type: 'CommentLine', value: 'x' }];
    cleanNodeComments(n2);
    // @ts-ignore
    expect(n2.leadingComments).toBeNull();

    // replaceNode
    const target = t.identifier('t');
    const source = t.identifier('s');
    // @ts-ignore
    source.start = 5;
    // @ts-ignore
    source.leadingComments = [{ type: 'CommentLine', value: 'c' }];

    const fakePath: any = { replaceWith: jest.fn() };
    replaceNode(fakePath as any, target as any, source as any);
    expect(fakePath.replaceWith).toHaveBeenCalledWith(target);
    // target should get loc and comments set
    // @ts-ignore
    expect(target.start).toBe(5);
  });
});
