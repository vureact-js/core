import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../nodes/element';

export function handleVIf(
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const exp = prop.exp as SimpleExpressionNode;
  const name = prop.name === 'else-if' ? 'elseIf' : prop.name;

  // 验证条件分支正确性
  if (name === 'else' || name === 'elseIf') {
    const lastNode = nodesIR[nodesIR.length - 1];

    if (lastNode?.meta.conditionalBranch) {
      const { conditionalBranch } = lastNode.meta;

      if (!conditionalBranch.if && !conditionalBranch.elseIf) {
        const { source, filename } = compileContext.context;

        logger.error('v-else/v-else-if has no adjacent v-if or v-else-if.', {
          source,
          file: filename,
          loc: prop.loc,
        });

        return true;
      }
    }
  }

  nodeIR.meta.conditionalBranch = {
    [name]: true,
    value: exp?.content,
  };
}
