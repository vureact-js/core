import type { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { defaultKind } from '@constants/other';
import { EDDIE_REACT_DEPS, REACT_DEP_HOOKS, REACT_HOOKS } from '@constants/react';
import { IS_FIRST_MOUNT } from '@transform/constants';
import { createSetterName } from '@transform/utils';
import { shortHash } from '@utils/random';
import { isUndefined } from '@utils/types';
import type { ScriptTransformContext } from './types';

export function createContext(): ScriptTransformContext {
  return {
    lang: '',
    filename: '',
    reactiveBindings: [],
    props: [],
    emits: [],
    lifecycleHooks: [],
    callbackDeps: new Set(),
    imports: {
      react: new Set(),
      [EDDIE_REACT_DEPS]: new Set(),
    },
  };
}

export function createImports(list: string[], from: string): t.ImportDeclaration {
  return t.importDeclaration(
    list.map((name) => t.importSpecifier(t.identifier(name), t.identifier(name))),
    t.stringLiteral(from),
  );
}

export function createUseFirstMountState(): t.VariableDeclaration {
  return t.variableDeclaration(defaultKind, [
    t.variableDeclarator(
      t.identifier(IS_FIRST_MOUNT),
      t.callExpression(t.identifier(REACT_DEP_HOOKS.useFirstMountState), []),
    ),
  ]);
}

type ExtendExpression =
  | t.Expression
  | t.SpreadElement
  | t.ArgumentPlaceholder
  | t.ArrowFunctionExpression
  | t.FunctionExpression;

export function createUseState(
  name: string,
  initialValue: ExtendExpression,
  declarator?: t.VariableDeclarator,
): t.VariableDeclarator {
  const call = t.callExpression(t.identifier(REACT_HOOKS.useState), [initialValue]);

  const typeParameters = extractTsTypeParameters(declarator);
  if (!isUndefined(typeParameters)) call.typeParameters = typeParameters;

  const valueId = t.identifier(name);
  const setterId = t.identifier(createSetterName(name));

  const typeAnnotation = extractTsTypeAnnotation(declarator);
  if (typeAnnotation) {
    valueId.typeAnnotation = typeAnnotation;
  }

  if (declarator && t.isArrayPattern(declarator.id)) {
    const origFirst = declarator.id.elements[0];
    if (t.isIdentifier(origFirst) && origFirst.typeAnnotation) {
      valueId.typeAnnotation = origFirst.typeAnnotation;
    }
  }

  const idPattern = t.arrayPattern([valueId, setterId]);

  return t.variableDeclarator(idPattern, call);
}

export function createUseImmer(
  name: string,
  initialValue: ExtendExpression,
  declarator?: t.VariableDeclarator,
): t.VariableDeclarator {
  const call = t.callExpression(t.identifier(REACT_DEP_HOOKS.useImmer), [initialValue]);

  const typeParameters = extractTsTypeParameters(declarator);
  if (!isUndefined(typeParameters)) call.typeParameters = typeParameters;

  const valueId = t.identifier(name);
  const setterId = t.identifier(createSetterName(name));

  const typeAnnotation = extractTsTypeAnnotation(declarator);
  if (typeAnnotation) {
    valueId.typeAnnotation = typeAnnotation;
  }

  if (declarator && t.isArrayPattern(declarator.id)) {
    const origFirst = declarator.id.elements[0];
    if (t.isIdentifier(origFirst) && origFirst.typeAnnotation) {
      valueId.typeAnnotation = origFirst.typeAnnotation;
    }
  }

  const idPattern = t.arrayPattern([valueId, setterId]);

  return t.variableDeclarator(idPattern, call);
}

export function createUseMemo(
  expr: ExtendExpression,
  dependencies: string[],
  name: string,
  declarator?: t.VariableDeclarator,
): t.VariableDeclarator {
  const depsArray = t.arrayExpression(dependencies.map((dep) => t.identifier(dep)));

  const call = t.callExpression(t.identifier(REACT_HOOKS.useMemo), [expr, depsArray]);

  const typeParameters = extractTsTypeParameters(declarator);
  if (!isUndefined(typeParameters)) call.typeParameters = typeParameters;

  const typeArguments = extractTsTypeArguments(declarator);
  if (!isUndefined(typeArguments)) call.typeArguments = typeArguments;

  const id = t.identifier(name);
  const typeAnnotation = extractTsTypeAnnotation(declarator);
  if (typeAnnotation) id.typeAnnotation = typeAnnotation;

  return t.variableDeclarator(id, call);
}

export function createUseCallback(
  expr: t.ArrowFunctionExpression | t.FunctionDeclaration | t.FunctionExpression,
  dependencies: string[],
): t.CallExpression {
  let exprForCallback: t.FunctionExpression | t.ArrowFunctionExpression;
  if (t.isFunctionDeclaration(expr)) {
    const { params, body, generator, async, returnType, typeParameters } = expr;
    exprForCallback = t.functionExpression(null, params, body, generator, async);
    exprForCallback.returnType = returnType;
    exprForCallback.typeParameters = typeParameters;
  } else {
    exprForCallback = expr;
  }

  // 尝试复用类型参数（若提供 declarator.init.typeParameters）
  const call = t.callExpression(t.identifier(REACT_HOOKS.useCallback), [
    exprForCallback,
    t.arrayExpression(dependencies.map((dep) => t.identifier(dep))),
  ]);

  return call;
}

export function createUseMount(fn: ExtendExpression): t.CallExpression {
  if (isAsyncFunc(fn)) {
    return createUseAsync(fn, []);
  }
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useMount), [fn]);
}

export function createUseUnMount(fn: ExtendExpression): t.CallExpression {
  if (isAsyncFunc(fn)) {
    return createUseAsync(fn, [], true);
  }
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useUnmount), [fn]);
}

export function createUseLayoutEffect(fn: ExtendExpression, deps?: string[]): t.CallExpression {
  const callback = [fn];
  if (!isUndefined(deps)) {
    callback.push(t.arrayExpression(deps.map(t.identifier)));
  }
  return t.callExpression(t.identifier(REACT_HOOKS.useLayoutEffect), callback);
}

export function createUseEffect(fn: ExtendExpression, deps?: string[]): t.CallExpression {
  if (isAsyncFunc(fn)) {
    return createUseAsync(fn);
  }
  const callback = [fn];
  if (!isUndefined(deps)) {
    callback.push(t.arrayExpression(deps.map(t.identifier)));
  }
  return t.callExpression(t.identifier(REACT_HOOKS.useEffect), callback);
}

// React effect hook that ignores the first invocation (e.g. on mount).
export function createUseUpdateEffect(fn: ExtendExpression, deps: string[]): t.CallExpression {
  if (isAsyncFunc(fn)) {
    // @ts-ignore
    fn.body = injectFirstMountCheck(fn.body) as t.BlockStatement;
    return createUseAsync(fn, deps);
  }
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useUpdateEffect), [
    fn,
    t.arrayExpression(deps.map(t.identifier)),
  ]);
}

// using deep comparison on its dependencies instead of reference equality.
export function createUseDeepUpdateEffect(fn: ExtendExpression, deps: string[]): t.CallExpression {
  // @ts-ignore
  fn.body = injectFirstMountCheck(fn.body) as t.BlockStatement;
  if (isAsyncFunc(fn)) {
    return createUseAsync(fn, deps);
  }
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useDeepCompareEffect), [
    fn,
    t.arrayExpression(deps.map(t.identifier)),
  ]);
}

// runs an effect only once.
export function createUseEffectOnce(fn: ExtendExpression): t.CallExpression {
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useEffectOnce), [fn]);
}

export function createUseAsync(
  fn: ExtendExpression,
  deps?: string[],
  isCleanup = false,
): t.CallExpression {
  let _deps: t.ArrayExpression = t.arrayExpression([]);
  if (!isUndefined(deps)) {
    _deps = t.arrayExpression(deps.map(t.identifier));
  }
  const callback = [fn, _deps];
  const cleanup = [
    t.arrowFunctionExpression([], t.blockStatement([t.returnStatement(fn as t.Expression)])),
    _deps,
  ];
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useAsync), !isCleanup ? callback : cleanup);
}

export function createUseActivate(fn: ExtendExpression): t.CallExpression {
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useActivated), [fn]);
}

export function createUseUnactivate(fn: ExtendExpression): t.CallExpression {
  return t.callExpression(t.identifier(REACT_DEP_HOOKS.useDeactivated), [fn]);
}

export function isAsyncFunc(fn: ExtendExpression): boolean {
  if (
    t.isFunctionDeclaration(fn) ||
    t.isArrowFunctionExpression(fn) ||
    t.isFunctionExpression(fn)
  ) {
    return fn.async;
  }
  return false;
}

// 提取 TS 泛型 / Extract TS generics from declarator
function extractTsTypeParameters(
  declarator?: t.VariableDeclarator,
): t.TSTypeParameterInstantiation | undefined {
  if (declarator?.init && t.isCallExpression(declarator.init) && declarator.init.typeParameters) {
    return declarator.init.typeParameters;
  }
}

// 提取 TS 参数类型 / Extract TS arguments types from declarator
function extractTsTypeArguments(
  declarator?: t.VariableDeclarator,
): t.TypeParameterInstantiation | undefined {
  if (declarator?.init && t.isCallExpression(declarator.init) && declarator.init.typeArguments) {
    return declarator.init.typeArguments;
  }
}

// 提取 TS 注解 / Extract TS annotation types from declarator
function extractTsTypeAnnotation(
  declarator?: t.VariableDeclarator,
): t.TypeAnnotation | t.TSTypeAnnotation | t.Noop | undefined {
  if (declarator && t.isIdentifier(declarator.id) && declarator.id.typeAnnotation) {
    return declarator.id.typeAnnotation;
  }
}

export function stripValueSuffix(
  node: t.Expression,
  context: ScriptTransformContext,
  maxDepth = 50, // 默认深度限 50，防栈滥用 / Default depth limit 50 to prevent abuse
): t.Expression {
  if (!t.isMemberExpression(node)) return node;

  const parts: Array<{
    prop: t.Expression | t.Identifier | t.PrivateName;
    computed: boolean;
    optional: boolean | null | undefined;
  }> = [];

  let depth = 0;
  let current: t.Expression = node;
  let optional = node.optional;

  while (t.isMemberExpression(current)) {
    if (depth++ > maxDepth) {
      return node;
    }

    const { property, computed } = current as t.MemberExpression;
    let isValueSuffix = false;

    // 非计算属性 Identifier 'value'
    if (!computed && t.isIdentifier(property) && property.name === 'value') {
      isValueSuffix = true;
    }
    // 计算属性 StringLiteral 'value'
    else if (computed && t.isStringLiteral(property) && property.value === 'value') {
      isValueSuffix = true;
    }

    if (isValueSuffix && t.isIdentifier(current.object)) {
      const objName = current.object.name;
      if (context.reactiveBindings.some((b) => b.name === objName)) {
        optional = current.optional || optional; // 累积可选链 / Accumulate optional chain
        // 向上剥离 .value（不修改 AST，只移动 current 指针）
        current = current.object;
        continue;
      }
    }

    // 跳过私有字段 / Skip private fields
    if (t.isPrivateName(property)) return node;

    // 收集非 .value 部分 / Collect non-.value parts
    parts.unshift({ prop: property, computed, optional: current.optional });
    current = current.object;
  }

  if (!t.isExpression(current)) return node;

  // 重建表达式：从 base 起添加 parts / Rebuild expression: From base add parts
  let newExpr: t.Expression = current;
  for (const part of parts) {
    newExpr = t.memberExpression(newExpr, part.prop as t.Expression, part.computed, part.optional);
  }

  // 不要在此直接操作 parent（会导致循环引用），只返回重建的表达式。
  return newExpr;
}

export function collectDependencies(
  path: NodePath<t.Expression | t.Statement>,
  context: ScriptTransformContext,
): string[] {
  if (isUndefined(path.node)) return [];

  const deps: Set<string> = new Set();

  // 定义 visitor：标准 Babel 遍历模式 / Define visitor: Standard Babel traversal
  const visitor: Visitor = {
    Identifier(path) {
      const name = path.node.name;
      if (context.reactiveBindings.some((b) => b.name === name)) {
        deps.add(name);
      } else if (context.callbackDeps.has(name)) {
        deps.add(name);
      }
    },
    MemberExpression(path) {
      const { node } = path;
      if (t.isIdentifier(node.property)) {
        const propName = node.property.name;
        // 收集 .value 的 base / Collect .value base
        if (propName === 'value' && t.isIdentifier(node.object)) {
          const objName = node.object.name;
          if (context.reactiveBindings.some((b) => b.name === objName)) {
            deps.add(objName);
          }
        }
      }
    },
    CallExpression(path) {
      // 递归子参数：用子 path.traverse，避免裸 traverse / Recurse via sub-paths
      path.get('arguments').forEach((argPath) => {
        if (argPath.isExpression()) {
          const subDeps = collectDependencies(argPath, context);
          subDeps.forEach((d) => deps.add(d));
        }
      });
    },
  };

  path.traverse(visitor);
  return Array.from(deps);
}

export function getDeclarationKind(
  path: NodePath,
): 'const' | 'let' | 'var' | 'using' | 'await using' {
  // 对于函数表达式，向上查找最近的 VariableDeclaration
  // Function expression, looking up to the nearest VariableDeclaration
  const varDecl = path.findParent((p) => p.isVariableDeclaration());
  if (varDecl && t.isVariableDeclaration(varDecl.node)) {
    return varDecl.node.kind;
  }

  // 对于函数声明，默认按 const 处理（因为函数声明会提升且不可重新赋值）
  // Function declarations are treated as const by default
  if (t.isFunctionDeclaration(path.node)) {
    return defaultKind;
  }

  return defaultKind;
}

export function isTopLevelFunc(path: NodePath<t.Node>): boolean {
  return (
    path.parentPath?.isProgram() ||
    path.parentPath?.isBlockStatement() ||
    ((t.isFunctionExpression(path.node) || t.isArrowFunctionExpression(path.node)) &&
      path.parentPath?.isVariableDeclarator()) ||
    false
  );
}

export function getFunctionName(path: NodePath<t.Node>): string {
  const node = path.node;
  if (t.isFunctionDeclaration(node) && node.id) {
    return node.id.name;
  }
  if (path.parentPath?.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
    return path.parentPath.node.id.name;
  }
  return `anon_${shortHash(4)}`;
}

export function normalizeHookName(s: string): string {
  // example: onMounted -> mounted
  if (s.startsWith('on')) {
    return s.charAt(2).toLowerCase() + s.slice(3);
  }
  return s;
}

function injectFirstMountCheck(
  body: t.BlockStatement | t.Expression,
  negation = false,
): t.BlockStatement | t.Expression {
  const name = negation ? `!${IS_FIRST_MOUNT}` : IS_FIRST_MOUNT;
  if (t.isBlockStatement(body)) {
    body.body.unshift(t.ifStatement(t.identifier(name), t.returnStatement()));
    return body;
  } else {
    // Non-block: Wrap as block.
    // example: () => xxx will chang to () => { if(IS_FIRST_MOUNT) return; return {xxx} }
    return t.blockStatement([
      t.ifStatement(t.identifier(name), t.returnStatement()),
      t.returnStatement(body),
    ]);
  }
}
