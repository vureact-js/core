import { NodePath, types as t } from '@babel/core';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { recordImport } from '@shared/runtime-utils';
import { reactHookBuilder } from './builders/react-hook-builder';
import { analyzeFuncArgDeps } from './shared/analyze-dependency';
import { checkNodeIsInBlock } from './shared/babel-utils';

const adaptApis = {
  onBeforeMount: RV3_HOOKS.useBeforeMount,
  onMounted: RV3_HOOKS.useMounted,
  onBeforeUnmount: RV3_HOOKS.useBeforeUnMount,
  onUnmounted: RV3_HOOKS.useUnmounted,
  onBeforeUpdate: RV3_HOOKS.useBeforeUpdate,
  onUpdated: RV3_HOOKS.useUpdated,
} as const;

export function transformLifecycle(path: NodePath<t.CallExpression>) {
  const { callee, arguments: args } = path.node;

  if (!t.isIdentifier(callee)) return;

  const { name: fnName } = callee;
  const adaptApi = adaptApis[fnName as keyof typeof adaptApis];

  if (!adaptApi) return;

  const { source, filename } = compileContext.context;

  if (args.length > 1) {
    logger.warn('Ignored unsupported lifecycle options.', {
      source,
      file: filename,
      loc: args[1]!.loc!,
    });
    args.pop();
  }

  const [callExp] = args;

  if (t.isFunction(callExp) && callExp.params.length) {
    logger.warn('Ignored unsupported lifecycle param.', {
      source,
      file: filename,
      loc: callExp.params[0]!.loc!,
    });
  }

  checkNodeIsInBlock(path);
  recordImport(RuntimeModules.RV3_HOOKS, adaptApi, true);

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
      const deps = analyzeFuncArgDeps(callExp as t.Expression, path);

      if (adaptApi === adaptApis.onBeforeUpdate) {
        path.replaceWith(reactHookBuilder.useBeforeUpdate(args, deps));
      } else {
        path.replaceWith(reactHookBuilder.useUpdate(args, deps));
      }

      break;
    }
  }
}
