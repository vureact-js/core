import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import { createCallExpProcessor } from '../../shared/processor-factory';

export function processReadonlyApi(ctx: ICompilationContext): TraverseOptions {
  const adaptApis = {
    readonly: VuR_Runtime.useReadonly,
    shallowReadonly: VuR_Runtime.useShallowReadonly,
  } as const;

  return {
    CallExpression(path) {
      createCallExpProcessor(ctx, path, {
        adaptApis,
        onProcessed(adaptName) {
          recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, adaptName, true);
        },
      });
    },
  };
}
