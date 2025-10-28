import * as t from '@babel/types';
import type { SimpleExpressionNode } from '@vue/compiler-core';
import type { ExtendedInterpolationNode } from './types';

export function transformInterpolation(
  node: ExtendedInterpolationNode
): t.JSXExpressionContainer {
  return t.jsxExpressionContainer(
    node.babelExp ||
      t.identifier((node.content as SimpleExpressionNode).content)
  );
}
