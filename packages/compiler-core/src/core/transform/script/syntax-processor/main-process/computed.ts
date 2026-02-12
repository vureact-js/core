import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { ReactApis, RuntimeModules } from '@consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/record-import';
import { analyzeFuncBodyDeps } from '../../shared/analyze-dependency';
import { createCallExpProcessor } from '../../shared/processor-factory';

export function processComputedApi(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      createCallExpProcessor(ctx, path, {
        adaptApis: {
          computed: ReactApis.useMemo,
        },
        warnArguments: true,
        warnWithoutDeclaration: true,

        addDeps: (fnBody) => analyzeFuncBodyDeps(fnBody, path),

        onProcessed() {
          recordImport(ctx, RuntimeModules.REACT, ReactApis.useMemo);
        },
      });
    },
  };
}
