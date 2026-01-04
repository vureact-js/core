import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { RuntimeModules, VuR_Runtime } from '@src/consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { isCalleeNamed, replaceCallName } from '../../shared/babel-utils';
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
}

function processInjectApi(path: NodePath<t.CallExpression>) {
  const { node } = path;

  if (!isCalleeNamed(node, 'inject')) {
    path.skip();
    return;
  }

  warnVueHookInBlock(path);
  warnVueHookInAnyCallback(path);

  replaceCallName(node, VuR_Runtime.useCtx);
  recordImport(RuntimeModules.VUREACT_RUNTIME, VuR_Runtime.useCtx, true);
}
