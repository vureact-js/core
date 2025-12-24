import { NodePath, types as t } from '@babel/core';
import { RV3_HOOKS } from '@consts/runtimeModules';
import { reactHookBuilder } from './builders/react-hook-builder';
import { analyzeFuncArgDeps } from './shared/analyze-dependency';
import { requiredCallExpHandling } from './shared/required-before-transform';

const adaptApis = {
  onBeforeMount: RV3_HOOKS.useBeforeMount,
  onMounted: RV3_HOOKS.useMounted,
  onBeforeUnmount: RV3_HOOKS.useBeforeUnMount,
  onUnmounted: RV3_HOOKS.useUnmounted,
  onBeforeUpdate: RV3_HOOKS.useBeforeUpdate,
  onUpdated: RV3_HOOKS.useUpdated,
} as const;

export function transformLifecycle(path: NodePath<t.CallExpression>) {
  const result = requiredCallExpHandling(path, adaptApis);

  if (!result) return;

  const { args, adaptApi } = result;

  switch (adaptApi) {
    case adaptApis.onBeforeMount:
      path.replaceWith(reactHookBuilder.useBeforeMount(args));
      break;

    case adaptApis.onMounted:
      path.replaceWith(reactHookBuilder.useMounted(args));
      break;

    case adaptApis.onBeforeUnmount:
      path.replaceWith(reactHookBuilder.useBeforeUnmount(args));
      break;

    case adaptApis.onUnmounted:
      path.replaceWith(reactHookBuilder.useUnmounted(args));
      break;

    case adaptApis.onBeforeUpdate:
    case adaptApis.onUpdated: {
      const deps = analyzeFuncArgDeps(args[0] as t.Expression, path);

      if (adaptApi === adaptApis.onBeforeUpdate) {
        path.replaceWith(reactHookBuilder.useBeforeUpdate(args, deps));
      } else {
        path.replaceWith(reactHookBuilder.useUpdate(args, deps));
      }

      break;
    }
  }
}
