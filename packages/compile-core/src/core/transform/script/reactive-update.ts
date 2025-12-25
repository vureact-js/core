import { traverse } from '@babel/core';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ScriptBlockIR } from '.';
import { isReactiveBinding } from './shared/analyze-dependency';
import {
  BabelNodeExtensionMeta,
  getNodeExtensionMeta,
  getRootIdByNode,
} from './shared/babel-utils';

export function handleReactiveUpdate(ast: ScriptBlockIR) {
  traverse(ast, {
    // 处理调用表达式更新
    CallExpression(path) {
      transformCallExpUpdate(path);
    },

    // 处理赋值表达式
    AssignmentExpression(path) {
      transformAssignment(path);
    },

    // 处理自增自减表达式
    UpdateExpression(path) {
      transformSelfUpdate(path);
    },
  });
}

function transformAssignment(path: NodePath<t.AssignmentExpression>) {
  const { node } = path;
  const nodeMeta = findIsReactiveAccess(path, node.left);
  replaceWithSetter(path, nodeMeta);
}

function transformSelfUpdate(path: NodePath<t.UpdateExpression>) {
  const { node } = path;
  const nodeMeta = findIsReactiveAccess(path, node.argument);
  replaceWithSetter(path, nodeMeta);
}

function transformCallExpUpdate(path: NodePath<t.CallExpression>) {
  const {
    node: { callee },
  } = path;

  // 只处理成员表达式形式的方法调用，如 arr.push()
  if (!t.isMemberExpression(callee) && !t.isOptionalMemberExpression(callee)) {
    return;
  }

  const nodeMeta = findIsReactiveAccess(path, callee);
  replaceWithSetter(path, nodeMeta);
}

export function findIsReactiveAccess(
  path: NodePath,
  expression: t.Expression | t.OptionalMemberExpression | t.LVal,
): BabelNodeExtensionMeta | undefined {
  const rootId = getRootIdByNode(expression);

  if (!rootId) return;

  const binding = path.scope.getBinding(rootId.name);

  if (isReactiveBinding(binding?.path.node)) {
    return getNodeExtensionMeta(binding!.path.node);
  }
}

function replaceWithSetter(
  path: NodePath,
  meta?: BabelNodeExtensionMeta,
): t.CallExpression | undefined {
  if (!meta) return;

  const { getterName, setterName } = meta;

  if (!getterName || !setterName) return;

  const newNode = buildSetterFunc(getterName, setterName, path.node as t.Expression);
  path.replaceWith(newNode);
}

function buildSetterFunc(
  getterName: string,
  setterName: string,
  exp: t.Expression,
): t.CallExpression {
  return t.callExpression(t.identifier(setterName), [
    t.arrowFunctionExpression(
      [t.identifier(getterName)],
      t.blockStatement([t.expressionStatement(exp), t.returnStatement(t.identifier(getterName))]),
    ),
  ]);
}
