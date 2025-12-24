import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { RV3_HOOKS } from '@consts/runtimeModules';
import { reactHookBuilder } from './builders/react-hook-builder';
import { analyzeFuncArgDeps } from './shared/analyze-dependency';
import { requiredCallExpHandling } from './shared/required-before-transform';

const adaptApis = {
  watchEffect: RV3_HOOKS.useWatchEffect,
  watchPostEffect: RV3_HOOKS.useWatchPostEffect,
  watchSyncEffect: RV3_HOOKS.useWatchSyncEffect,
} as const;

export function tranformWatchEffect(path: NodePath<t.CallExpression>) {
  const result = requiredCallExpHandling(path, adaptApis);

  if (!result) return;

  const { args, adaptApi } = result;
  const deps = analyzeFuncArgDeps(args[0] as t.Expression, path);

  const timing = adaptApi.includes('Sync')
    ? 'sync'
    : adaptApi.includes('Post')
      ? 'post'
      : undefined;

  path.replaceWith(reactHookBuilder.useWatchEffect(args, deps, timing));
}
