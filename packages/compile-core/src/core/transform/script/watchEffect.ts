import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { analyzeFuncArgDeps } from './shared/analyze-dependency';
import { warnVueHookArguments, warnVueHookInBlock } from './shared/unsupported-warn';

const adaptApis = {
  watchEffect: RV3_HOOKS.useWatchEffect,
  watchPostEffect: RV3_HOOKS.useWatchPostEffect,
  watchSyncEffect: RV3_HOOKS.useWatchSyncEffect,
} as const;

export function tranformWatchEffect(path: NodePath<t.CallExpression>) {
  const { callee, arguments: args } = path.node;

  if (!t.isIdentifier(callee)) return;

  const { name: fnName } = callee;
  const adaptApi = adaptApis[fnName as keyof typeof adaptApis];

  if (!adaptApi) return;

  warnVueHookInBlock(path);
  warnVueHookArguments(args);
  recordImport(RuntimeModules.RV3_HOOKS, adaptApi, true);

  const deps = analyzeFuncArgDeps(args[0] as t.Expression, path);
  const timing = adaptApi.includes('Sync')
    ? 'sync'
    : adaptApi.includes('Post')
      ? 'post'
      : undefined;

  path.replaceWith(reactHookBuilder.useWatchEffect(args, deps, timing));
}
