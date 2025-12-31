import { TraverseOptions } from '@babel/traverse';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { createCallExpProcessor } from '../../shared/processor-factory';

export function processWatchApi(): TraverseOptions {
  return {
    CallExpression(path) {
      createCallExpProcessor(path, {
        adaptApis: {
          watch: VuR_Runtime.useWatch,
        },
        warnInInAnyCallback: true,

        onProcessed(adaptName) {
          recordImport(RuntimeModules.VUREACT_RUNTIME, adaptName, true);
        },
      });
    },
  };
}
