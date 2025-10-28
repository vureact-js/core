import traverse from '@babel/traverse';
import * as t from '@babel/types';
import {
  REACT_ACTIVATION,
  REACT_HOOKS,
  REACT_USE,
  THIRD_PARTY,
  USE_IMMER,
  VUE_TO_REACT_HOOKS,
} from '@constants/react';
import type { ScriptTransformContext } from './types';
import { isTopLevelFunc, normalizeHookName } from './utils';

export function collectNeededImports(ast: t.File, ctx: ScriptTransformContext) {
  const { neededImports } = ctx;
  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node;
      if (!t.isIdentifier(callee)) return;

      const apiName = normalizeHookName(callee.name);
      if (apiName in VUE_TO_REACT_HOOKS) {
        const hookName = VUE_TO_REACT_HOOKS[apiName]!;
        if (hookName in REACT_HOOKS) {
          neededImports.react.add(hookName);
        }
        if (hookName in REACT_USE) {
          neededImports[THIRD_PARTY.reactUse]
            .add(hookName)
            // Conservative import. even if unused, bundlers will auto tree-shaking
            .add(REACT_USE.useAsync)
            .add(REACT_USE.useFirstMountState);
        }
        if (hookName in REACT_ACTIVATION) {
          neededImports[THIRD_PARTY.reactActivation].add(hookName);
        }
        if (hookName === USE_IMMER) {
          neededImports[THIRD_PARTY.useImmer] = true;
          // Simple values ​​require useState and should be introduced import.
          neededImports.react.add(REACT_HOOKS.useState);
        }

        // 找到匹配的 API 后，跳过当前节点的后续遍历
        path.skip();
      }
    },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(path) {
      if (isTopLevelFunc(path)) {
        // Conservative import
        neededImports.react.add(REACT_HOOKS.useCallback);
        path.skip();
      }
    },
  });
}
