import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { EDDIE_REACT_DEPS, REACT_DEP_HOOKS, REACT_HOOKS } from '@constants/react';
import { logger } from '@transform/utils/logger';
import type { ScriptTransformContext } from './types';
import { normalizeHookName } from './utils';

export function collectNeededImports(ast: t.File, ctx: ScriptTransformContext) {
  const { imports } = ctx;

  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node;

      if (!t.isIdentifier(callee)) return;

      const callName = normalizeHookName(callee.name);

      if (callName in REACT_HOOKS) {
        imports.react.add(callName);
      }
      if (callName in REACT_DEP_HOOKS) {
        imports[EDDIE_REACT_DEPS].add(callName);
      }

      path.skip();
    },
  });

  logger.debug(imports, 'collectNeededImports.ts');
}
