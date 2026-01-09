import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { analyzeFuncArgDeps } from '../../shared/analyze-dependency';
import { createCallExpProcessor } from '../../shared/processor-factory';

export function processLifecycleApi(ctx: ICompilationContext): TraverseOptions {
  const adaptApis = {
    onBeforeMount: VuR_Runtime.useBeforeMount,
    onMounted: VuR_Runtime.useMounted,
    onBeforeUnmount: VuR_Runtime.useBeforeUnMount,
    onUnmounted: VuR_Runtime.useUnmounted,
    onBeforeUpdate: VuR_Runtime.useBeforeUpdate,
    onUpdated: VuR_Runtime.useUpdated,
  } as const;

  return {
    CallExpression(path) {
      const { node } = path;

      if (t.isIdentifier(node.callee) && node.callee.name === VuR_Runtime.nextTick) {
        recordImport(RuntimeModules.VUREACT_RUNTIME, VuR_Runtime.nextTick, true);
        return;
      }

      createCallExpProcessor(ctx, path, {
        adaptApis,
        warnArguments: true,
        warnInInAnyCallback: true,

        addDeps: (fnArg) => analyzeFuncArgDeps(fnArg, path),

        onProcessed(adaptName) {
          recordImport(RuntimeModules.VUREACT_RUNTIME, adaptName, true);
        },
      });
    },
  };
}
