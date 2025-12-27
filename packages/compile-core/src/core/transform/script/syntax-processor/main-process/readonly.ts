import { TraverseOptions } from '@babel/traverse';
import { RuntimeModules, RV3_HOOKS } from '@consts/runtimeModules';
import { recordImport } from '@shared/runtime-utils';
import { createCallExpProcessor } from './processor-factory';

export function processReadonlyApi(): TraverseOptions {
  const adaptApis = {
    readonly: RV3_HOOKS.useReadonly,
    shallowReadonly: RV3_HOOKS.useShallowReadonly,
  } as const;

  return {
    CallExpression(path) {
      createCallExpProcessor(path, {
        adaptApis,
        onProcessed(adaptName) {
          recordImport(RuntimeModules.RV3_HOOKS, adaptName, true);
        },
      });
    },
  };
}
