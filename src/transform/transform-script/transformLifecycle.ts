import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { VUE_LIFECYCLE_HOOKS } from '@constants/vue';
import { logger } from '@transform/utils/logger';
import type { ScriptTransformContext } from './types';
import {
  collectDependencies,
  createUseActivate,
  createUseLayoutEffect,
  createUseMount,
  createUseUnactivate,
  createUseUnMount,
  createUseUpdateEffect,
  normalizeHookName,
} from './utils';

export function transformLifecycle(ast: t.File, ctx: ScriptTransformContext) {
  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node;
      if (t.isIdentifier(callee)) {
        const name = normalizeHookName(callee.name);
        if (name in VUE_LIFECYCLE_HOOKS) {
          const mapped = mapLifecycle(path, name, ctx);
          if (mapped) {
            path.addComment('leading', ` ${callee.name}`, true);
            path.replaceWith(mapped);
          }
        }
      }
    },
  });
}

function mapLifecycle(
  path: NodePath<t.CallExpression>,
  hookName: string,
  ctx: ScriptTransformContext,
) {
  const { node: call } = path;
  const fnPath = path.get('arguments.0') as NodePath<t.Expression>;
  const fn = fnPath.node ?? t.arrayExpression([]);

  if (!t.isFunctionExpression(fn) && !t.isArrowFunctionExpression(fn)) {
    logger.warn(fn, `Invalid function arg for lifecycle "${hookName}"; using empty fallback`);
  }

  let body: t.Statement[] = [];
  let deps = collectDependencies(fnPath, ctx);

  if (t.isFunctionExpression(fn) || t.isArrowFunctionExpression(fn)) {
    if (fn.body && t.isBlockStatement(fn.body)) {
      body = fn.body.body;
    }
  }

  ctx.lifecycleHooks.push({
    hook: hookName,
    body,
    dependencies: new Set(deps),
  });

  const lifecycleMap: Record<keyof typeof VUE_LIFECYCLE_HOOKS, () => t.CallExpression> = {
    beforeMount: () => createUseMount(fn),
    mounted: () => createUseMount(fn),
    beforeUpdate: () => createUseLayoutEffect(fn),
    updated: () => createUseUpdateEffect(fn, deps),
    beforeUnmount: () => createUseUnMount(fn),
    unmounted: () => createUseUnMount(fn),
    activated: () => createUseActivate(fn),
    deactivated: () => createUseUnactivate(fn),
    errorCaptured: () => {
      logger.warn(call, 'Transform of errorCaptured lifecycle hook unsupported; leaving as-is');
      return call;
    },
  };

  // @ts-ignore
  const result = lifecycleMap[hookName]?.() || call;
  return result;
}
