import { TraverseOptions } from '@babel/traverse';
import { ReactApis, RuntimeModules } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { analyzeFuncBodyDeps } from '../../shared/analyze-dependency';
import { createCallExpProcessor } from '../../shared/processor-factory';

export function processComputedApi(): TraverseOptions {
  return {
    CallExpression(path) {
      createCallExpProcessor(path, {
        adaptApis: {
          computed: ReactApis.useMemo,
        },
        warnArguments: true,
        warnWithoutDeclaration: true,

        addDeps: (fnBody) => analyzeFuncBodyDeps(fnBody, path),

        onProcessed() {
          recordImport(RuntimeModules.REACT, ReactApis.useMemo, true);
        },
      });
    },
  };
}
