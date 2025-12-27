import { TraverseOptions } from '@babel/traverse';
import { React_Hooks, RuntimeModules } from '@consts/runtimeModules';
import { recordImport } from '@src/shared/runtime-utils';
import { analyzeFuncBodyDeps } from '../../shared/analyze-dependency';
import { createCallExpProcessor } from './processor-factory';

export function processComputedApi(): TraverseOptions {
  return {
    CallExpression(path) {
      createCallExpProcessor(path, {
        adaptApis: {
          computed: React_Hooks.useMemo,
        },
        warnArguments: true,
        warnWithoutDeclaration: true,

        addDeps: (fnBody) => analyzeFuncBodyDeps(fnBody, path),

        onProcessed() {
          recordImport(RuntimeModules.REACT, React_Hooks.useMemo, true);
        },
      });
    },
  };
}
