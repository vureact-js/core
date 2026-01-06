import { generate } from '@babel/generator';
import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { RuntimeModules, VuR_Runtime } from '@src/consts/runtimeModules';
import { compileContext, CompileContextType } from '@src/shared/compile-context';
import { recordImport } from '@src/shared/runtime-utils';
import {
  getParentVariableDeclarator,
  isCalleeNamed,
  replaceCallName,
  setNodeExtensionMeta,
} from '../../shared/babel-utils';
import { CallExpArgs } from '../../shared/types';
import { warnVueHookInAnyCallback, warnVueHookInBlock } from '../../shared/unsupported-warn';

export function resolveProvideInject(): TraverseOptions {
  return {
    CallExpression(path) {
      processProvideApi(path);
      processInjectApi(path);
    },
  };
}

function processProvideApi(path: NodePath<t.CallExpression>) {
  const { node } = path;

  if (!isCalleeNamed(node, 'provide')) {
    return;
  }

  warnVueHookInBlock(path);
  warnVueHookInAnyCallback(path);

  const { ctxProvider } = compileContext.context;

  const key = node.arguments[0];
  const value = node.arguments[1];

  const target = findOrCreateCtxProvider(ctxProvider);
  assignProviderValue(target, key, value);

  path.parentPath.remove();
}

function findOrCreateCtxProvider(root: CompileContextType['ctxProvider']) {
  if (!root.exists) {
    return root;
  }

  let cur = root.ctxProvider;
  while (cur?.exists) {
    cur = cur.ctxProvider ?? {};
  }

  return cur || (root.ctxProvider = {});
}

function assignProviderValue(
  target: Partial<CompileContextType['ctxProvider']>,
  key?: CallExpArgs[0],
  value?: CallExpArgs[0],
) {
  const getRawExp = (exp?: CallExpArgs[0]): string => {
    if (!exp) return '""'; // 空字符串

    if (t.isStringLiteral(exp)) {
      return `"${exp.value}"`;
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

  target.exists = true;
  target.name = getRawExp(key);
  target.value = getRawExp(value);
  target.ctxProvider = {};
}

function processInjectApi(path: NodePath<t.CallExpression>) {
  const { node } = path;

  if (!isCalleeNamed(node, 'inject')) {
    path.skip();
    return;
  }

  warnVueHookInBlock(path);
  warnVueHookInAnyCallback(path);

  const parentVarDecl = getParentVariableDeclarator(path);
  setNodeExtensionMeta(parentVarDecl.node, { isReactive: true, reactiveType: 'indirect' });

  replaceCallName(node, VuR_Runtime.useCtx);
  recordImport(RuntimeModules.VUREACT_RUNTIME, VuR_Runtime.useCtx, true);
}
