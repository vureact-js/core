import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { logger } from '@transform/utils/logger';
import { isUndefined } from '@utils/types';
import type { ScriptTransformContext } from './types';
import { collectDependencies, createUseLayoutEffect, isAsyncFunc } from './utils';

export function transformNextTick(ast: t.File, ctx: ScriptTransformContext) {
  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node;
      if (t.isIdentifier(callee)) {
        const { name } = callee;
        if (name === 'nextTick') {
          const replacement = replaceNextTick(path, ctx);
          if (!isUndefined(replacement)) {
            path.replaceWith(replacement);
            path.addComment('leading', ` ${name}`, true);
          }
        }
      }
    },
  });
}

function replaceNextTick(
  path: NodePath<t.CallExpression>,
  ctx: ScriptTransformContext,
): t.CallExpression | undefined {
  const args = path.get('arguments.0') as NodePath<t.Expression>;
  const { node: callback } = args;

  if (!callback) {
    logger.warn(path.node, 'nextTick missing callback arg;');
    return createUseLayoutEffect(t.arrowFunctionExpression([], t.blockStatement([])), []);
  }

  if (isAsyncFunc(callback)) {
    logger.error(
      callback,
      'Unable to transform nextTick with async callback; Consider using with async inside',
    );
    return;
  }
  const deps = collectDependencies(args, ctx);
  return createUseLayoutEffect(callback, deps);
}
