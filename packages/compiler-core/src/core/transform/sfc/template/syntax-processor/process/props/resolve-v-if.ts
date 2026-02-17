import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVIf(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
  siblingNodesIR: ElementNodeIR[],
): boolean | void {
  const name = node.name === 'else-if' ? 'elseIf' : node.name;
  const value = (node.exp as SimpleExpressionNode)?.content ?? 'true';

  const prevNode = siblingNodesIR[siblingNodesIR.length - 1];
  const isElseBranch = name === 'else' || name === 'elseIf';

  let hasError = false;

  if (isElseBranch && prevNode) {
    if (prevNode.meta.condition) {
      const { condition } = prevNode.meta;

      if (!condition.if && !condition.elseIf) {
        hasError = true;
      } else {
        prevNode.meta.condition!.next = nodeIR;
      }
    } else {
      hasError = true;
    }
  }

  if (hasError) {
    const { source, filename } = ctx;

    logger.error('v-else/v-else-if has no adjacent v-if or v-else-if.', {
      source,
      file: filename,
      loc: node.loc,
    });

    return hasError;
  }

  nodeIR.meta.condition = {
    isHandled: false,
    [name]: true,
    value,
    babelExp: {
      content: value,
      ast: resolveStringExpr(value, ctx),
    },
  };
}
