import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import { createCallExpProcessor } from '../../shared/processor-factory';

export function processWatchApi(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      createCallExpProcessor(ctx, path, {
        adaptApis: {
          watch: VuR_Runtime.useWatch,
        },
        warnInInAnyCallback: true,

        onProcessed(adaptName) {
          recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, adaptName, true);
        },
      });
    },
  };
}
