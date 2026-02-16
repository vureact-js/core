import { ArrayExpression } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { TemplateBlockIR } from '@transform/template';
import { resolveStringExpr } from '@transform/template/shared/resolve-string-expression';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVMemo(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = node.exp as SimpleExpressionNode;
  let value = exp?.content;

  if (value !== undefined) {
    if (!value.trim() || (!value.startsWith('[') && !value.endsWith(']'))) {
      const { source, filename } = ctx;

      logger.warn(
        'The expected value of v-memo is an array; otherwise, memoization will be skipped.',
        {
          loc: node.loc,
          source,
          file: filename,
        },
      );

      return;
    }
  } else {
    value = '[]';
  }

  nodeIR.meta.memo = {
    isHandled: false,
    isMemo: true,
    value,
    babelExp: {
      content: value,
      ast: resolveStringExpr(value, ctx) as ArrayExpression,
    },
  };
}
