import { traverse } from '@babel/core';
import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { analyzeFuncArgDeps } from '../../shared/analyze-dependency';
import { createCallExpProcessor } from './processor-factory';

export function processWatchEffectApi(): TraverseOptions {
  const adaptApis = {
    watchEffect: RV3_HOOKS.useWatchEffect,
    watchPostEffect: RV3_HOOKS.useWatchPostEffect,
    watchSyncEffect: RV3_HOOKS.useWatchSyncEffect,
  } as const;

  return {
    CallExpression(path) {
      createCallExpProcessor(path, {
        adaptApis,
        warnInInAnyCallback: true,

        addDeps: (fnArg) => analyzeFuncArgDeps(fnArg, path),

        onProcessed(adaptName) {
          handleCleanup(path);
          recordImport(RuntimeModules.RV3_HOOKS, adaptName, true);
        },
      });
    },
  };
}

function handleCleanup(path: NodePath<t.CallExpression>) {
  const { arguments: args } = path.node;
  const [fn] = args;

  if (!fn || !t.isFunction(fn)) return;

  const [onCleanup] = fn.params;

  fn.params.length = 0;

  if (!onCleanup || !t.isIdentifier(onCleanup)) return;

  traverse(
    fn,
    {
      CallExpression(innerPath) {
        const { callee, arguments: args } = innerPath.node;

        if (!t.isIdentifier(callee)) return;

        if (callee.name !== onCleanup.name) return;

        const [cleanupFn] = args;

        if (!cleanupFn || !t.isFunction(cleanupFn)) return;

        if (t.isBlockStatement(fn.body)) {
          fn.body.body.push(t.returnStatement(cleanupFn));
          innerPath.remove();
        }
      },
    },
    path.scope,
  );
}
