import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { EDDIE_REACT_DEPS, REACT_DEPS, REACT_HOOKS, VUE_TO_REACT_HOOKS } from '@constants/react';
import type { ScriptTransformContext } from './types';
import { isTopLevelFunc, normalizeHookName } from './utils';

// TODO 收集工作放到最后，无需通过复杂的表查询
export function collectNeededImports(ast: t.File, ctx: ScriptTransformContext) {
  const { imports } = ctx;
  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node;
      if (!t.isIdentifier(callee)) return;

      const vueApi = normalizeHookName(callee.name);

      if (vueApi in VUE_TO_REACT_HOOKS) {
        const reactApi = VUE_TO_REACT_HOOKS[vueApi]!;

        if (reactApi in REACT_HOOKS) {
          imports.react.add(reactApi);

          // We conservatively import useImmer because useState is only used for simple expressions;
          // complex expressions should be replaced with useImmer.
          if (reactApi === REACT_HOOKS.useState) {
            imports[EDDIE_REACT_DEPS].add(REACT_DEPS.useImmer);
          }
        } else if (reactApi in REACT_DEPS) {
          imports[EDDIE_REACT_DEPS].add(reactApi)
            // Conservative import
            .add(REACT_DEPS.useAsync)
            .add(REACT_DEPS.useFirstMountState);
        }

        path.skip();
      }
    },

    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(path) {
      if (isTopLevelFunc(path)) {
        imports.react.add(REACT_HOOKS.useCallback); // Conservative import
        path.skip();
      }
    },
  });
}
