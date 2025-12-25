import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { RV3_HOOKS } from '@consts/runtimeModules';
import { reactHookBuilder } from '../builders/react-hook-builder';
import { analyzeFuncArgDeps } from '../shared/analyze-dependency';
import { setNodeExtensionMeta } from '../shared/babel-utils';
import { requiredCallExpHandling } from '../shared/required-before-transform';

const adaptApis = {
  watchEffect: RV3_HOOKS.useWatchEffect,
  watchPostEffect: RV3_HOOKS.useWatchPostEffect,
  watchSyncEffect: RV3_HOOKS.useWatchSyncEffect,
} as const;

export function tranformWatchEffect(path: NodePath<t.CallExpression>) {
  const result = requiredCallExpHandling(path, adaptApis);

  if (!result) return;

  const { parent } = path;
  const { args, adaptApi } = result;
  const deps = analyzeFuncArgDeps(args[0] as t.Expression, path);

  const timing = adaptApi.includes('Sync')
    ? 'sync'
    : adaptApi.includes('Post')
      ? 'post'
      : undefined;

  // 变量声明的 watchEffect 返回值标记为间接响应式
  if (t.isVariableDeclarator(parent)) {
    setNodeExtensionMeta(parent, { isReactive: true, reactiveType: 'indirect' });
  }

  path.replaceWith(reactHookBuilder.useWatchEffect(args, deps, timing));
}
