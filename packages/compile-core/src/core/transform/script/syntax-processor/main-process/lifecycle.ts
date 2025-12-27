import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { analyzeFuncArgDeps } from '../../shared/analyze-dependency';
import { createCallExpProcessor } from './processor-factory';

export function processLifecycleApi(): TraverseOptions {
  const adaptApis = {
    onBeforeMount: RV3_HOOKS.useBeforeMount,
    onMounted: RV3_HOOKS.useMounted,
    onBeforeUnmount: RV3_HOOKS.useBeforeUnMount,
    onUnmounted: RV3_HOOKS.useUnmounted,
    onBeforeUpdate: RV3_HOOKS.useBeforeUpdate,
    onUpdated: RV3_HOOKS.useUpdated,
  } as const;

  return {
    CallExpression(path) {
      const { node } = path;

      if (t.isIdentifier(node.callee) && node.callee.name === RV3_HOOKS.nextTick) {
        recordImport(RuntimeModules.RV3_HOOKS, RV3_HOOKS.nextTick, true);
        return;
      }

      createCallExpProcessor(path, {
        adaptApis,
        warnArguments: true,
        warnInInAnyCallback: true,

        addDeps: (fnArg) => analyzeFuncArgDeps(fnArg, path),

        onProcessed(adaptName) {
          recordImport(RuntimeModules.RV3_HOOKS, adaptName, true);
        },
      });
    },
  };
}
