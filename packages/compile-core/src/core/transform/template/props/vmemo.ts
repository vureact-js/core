import { getContext } from '@core/transform/context';
import { logger } from '@shared/logger';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../nodes/element';

export function handleVMemo(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  let deps = exp?.content;

  // 判定为 v-memo
  if (deps !== undefined) {
    if (!deps.trim() || (!deps.startsWith('[') && !deps.endsWith(']'))) {
      const { source, filename } = getContext();

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
    deps = '[]';
  }

  nodeIR.isMemo = true;
  nodeIR.meta.memoDeps = deps;
}
