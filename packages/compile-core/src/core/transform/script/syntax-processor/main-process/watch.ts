import { TraverseOptions } from '@babel/traverse';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { createCallExpProcessor } from './processor-factory';

export function processWatchApi(): TraverseOptions {
  return {
    CallExpression(path) {
      createCallExpProcessor(path, {
        adaptApis: {
          watch: RV3_HOOKS.useWatch,
        },
        warnInInAnyCallback: true,

        onProcessed(adaptName) {
          recordImport(RuntimeModules.RV3_HOOKS, adaptName, true);
        },
      });
    },
  };
}
