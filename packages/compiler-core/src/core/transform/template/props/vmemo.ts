import { ArrayExpression } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { resolveTemplateExp } from '../shared/resolve-str-exp';

export function handleVMemo(ctx: ICompilationContext, prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  let value = exp?.content;

  // 判定为 v-memo
  if (value !== undefined) {
    if (!value.trim() || (!value.startsWith('[') && !value.endsWith(']'))) {
      const { source, filename } = ctx;

      logger.warn(
        'The expected value of v-memo is an array; otherwise, memoization will be skipped.',
        {
          loc: prop.loc,
          source,
          file: filename,
        },
      );
      return;
    }
  } else {
    // 判定为 v-once
    value = '[]';
  }

  nodeIR.meta.memo = {
    isHandled: false,
    isMemo: true,
    value,
    babelExp: {
      content: value,
      ast: resolveTemplateExp(ctx, value) as ArrayExpression,
    },
  };
}
