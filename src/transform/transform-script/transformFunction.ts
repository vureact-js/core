import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { REACT_HOOKS } from '@constants/react';
import { logger } from '@transform/utils/logger';
import { isUndefined } from '@utils/types';
import type { ScriptTransformContext } from './types';
import { collectDependencies, createUseCallback, getFunctionName, isTopLevelFunc } from './utils';

export function transformCallbacks(ast: t.File, ctx: ScriptTransformContext) {
  traverse(ast, {
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(path) {
      // path may be typed as NodePath<Node> by @babel/traverse typings when using a combined key,
      // so narrow to actual function nodes before calling the strongly-typed handler.
      if (isTopLevelFunc(path)) {
        const replacement = handleUseCallback(
          path as NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
          ctx,
        );
        if (!isUndefined(replacement)) {
          ctx.callbackDeps.add(getFunctionName(path));
          path.replaceWith(replacement);
        }
      }
    },
  });
}

function handleUseCallback(
  path: NodePath<t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression>,
  ctx: ScriptTransformContext,
): t.CallExpression | undefined {
  const node = path.node;
  if (!node) {
    logger.warn(path.get('body'), 'Function node is null in handleUseCallback; skipping');
    return;
  }

  let bodyDeps: string[] = [];
  if (t.isBlockStatement(node.body)) {
    // 如果是代码块形式的函数体，遍历每个语句
    node.body.body.forEach((stmt, idx) => {
      const bodyPath = path.get('body') as NodePath<t.BlockStatement>;
      const bodyChildren = bodyPath.get('body') as NodePath<t.Statement>[];
      const stmtPath = bodyChildren[idx];
      if (stmtPath) {
        const deps = collectDependencies(stmtPath, ctx);
        bodyDeps.push(...deps);
      }
    });
  } else if (t.isExpression(node.body)) {
    // 如果是表达式形式的函数体（箭头函数的简写形式）
    const bodyPath = path.get('body');
    if (bodyPath) {
      bodyDeps = collectDependencies(bodyPath, ctx);
    } else {
      logger.warn(node.body, 'Expression body path is null; empty deps []');
    }
  }

  const deps = [...new Set(bodyDeps)];

  // Skip if already inside a call to useCallback or any CallExpression (avoid wrapping args)
  const isInUseCallback = path.findParent(
    (p) =>
      p.isCallExpression() &&
      t.isIdentifier(p.node.callee) &&
      p.node.callee.name === REACT_HOOKS.useCallback,
  );

  // 精确内联：JSXAttribute 名含 'on' 或 'children'，或直接 JSXExpressionContainer（非 JSXElement）
  // Precise inline: JSXAttribute name with 'on'/children, or direct JSXExpressionContainer (not JSXElement)
  const isInRenderPath = !!path.findParent(
    (p) =>
      (p.isJSXAttribute() &&
        t.isJSXIdentifier(p.node.name) &&
        (p.node.name.name.startsWith('on') || p.node.name.name === 'children')) ||
      (p.isJSXExpressionContainer() && !p.parentPath?.isJSXElement()), // 非 JSXElement 子容器 / Non-JSXElement child container
  );

  // 如果已经在 useCallback 调用中，跳过
  const parentUseCb = path.findParent(
    (p) =>
      p.isCallExpression() &&
      t.isIdentifier(p.node.callee) &&
      p.node.callee.name === REACT_HOOKS.useCallback,
  );

  if (!deps.length || isInUseCallback || isInRenderPath || parentUseCb) return;

  const callExpr = createUseCallback(node, deps);

  return callExpr;
}
