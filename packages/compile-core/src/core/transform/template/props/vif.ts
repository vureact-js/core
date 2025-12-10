import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { parseFragmentExp } from '@src/shared/babel-utils';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';

export function handleVIf(
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): boolean | void {
  const exp = prop.exp as SimpleExpressionNode;
  const name = prop.name === 'else-if' ? 'elseIf' : prop.name;

  let error = false;

  // 验证条件分支正确性
  if (name === 'else' || name === 'elseIf') {
    const lastNode = nodesIR[nodesIR.length - 1];

    if (lastNode?.meta.condition) {
      const { condition } = lastNode.meta;

      if (!condition.if && !condition.elseIf) {
        error = true;
      }
    } else {
      error = true;
    }
  }

  if (error) {
    const { source, filename } = compileContext.context;

    logger.error('v-else/v-else-if has no adjacent v-if or v-else-if.', {
      source,
      file: filename,
      loc: prop.loc,
    });

    return error;
  }

  const value = exp?.content ?? 'true';
  nodeIR.meta.condition = {
    [name]: true,
    value,
    babelExp: parseFragmentExp(value),
  };
}
