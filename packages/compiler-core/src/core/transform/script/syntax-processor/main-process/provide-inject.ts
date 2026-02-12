import { generate } from '@babel/generator';
import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext, ProvideData } from '@compiler/context/types';
import { ADAPTER_HOOKS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { recordImport } from '@src/core/transform/shared/record-import';
import {
  getParentVariableDeclarator,
  isCalleeNamed,
  replaceCallName,
  setNodeExtensionMeta,
} from '../../shared/babel-utils';
import { CallExpArgs } from '../../shared/types';
import { warnVueHookInAnyCallback, warnVueHookInBlock } from '../../shared/unsupported-warn';

export function resolveProvideInject(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      processProvideApi(ctx, path);
      processInjectApi(ctx, path);
    },
  };
}

function processProvideApi(ctx: ICompilationContext, path: NodePath<t.CallExpression>) {
  const { node } = path;

  if (!isCalleeNamed(node, 'provide')) {
    return;
  }

  warnVueHookInBlock(ctx, path);
  warnVueHookInAnyCallback(ctx, path);

  const { provide } = ctx.scriptData;

  const key = node.arguments[0];
  const value = node.arguments[1];

  const target = findOrCreateCtxProvider(provide);
  assignProviderValue(target, key, value);

  path.parentPath.remove();
}

function findOrCreateCtxProvider(root: ProvideData) {
  if (!root.isOccupied) {
    return root;
  }

  let cur = root.provide;
  while (cur?.isOccupied) {
    cur = cur.provide ?? {};
  }

  return cur || (root.provide = {});
}

function assignProviderValue(
  target: ProvideData['provide'],
  key?: CallExpArgs[0],
  value?: CallExpArgs[0],
) {
  const getRawExp = (exp?: CallExpArgs[0]): string => {
    if (!exp) return "''"; // 空字符串

    if (t.isStringLiteral(exp)) {
      return `'${exp.value}'`;
    }

    if (t.isNumericLiteral(exp)) {
      return exp.value.toString();
    }

    if (t.isIdentifier(exp)) {
      return exp.name;
    }

    try {
      // 降级：直接使用源码
      return generate(exp).code;
    } catch {
      return 'null';
    }
  };

  target.isOccupied = true;
  target.name = getRawExp(key);
  target.value = getRawExp(value);
  target.provide = {};
}

function processInjectApi(ctx: ICompilationContext, path: NodePath<t.CallExpression>) {
  const { node } = path;

  if (!isCalleeNamed(node, 'inject')) return;

  warnVueHookInBlock(ctx, path);
  warnVueHookInAnyCallback(ctx, path);

  const parentVarDecl = getParentVariableDeclarator(path);

  setNodeExtensionMeta(parentVarDecl.node, { isReactive: true, reactiveType: 'indirect' });

  replaceCallName(node, ADAPTER_HOOKS.useCtx);
  recordImport(ctx, PACKAGE_NAME.runtime, ADAPTER_HOOKS.useCtx);
}
