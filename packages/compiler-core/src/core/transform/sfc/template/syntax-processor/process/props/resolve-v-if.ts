import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { TemplateBlockIR } from '@transform/sfc/template';
import { resolveStringExpr } from '@transform/sfc/template/shared/resolve-string-expression';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVIf(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
  siblingNodesIR: ElementNodeIR[],
): boolean | void {
  const name = directive.name === 'else-if' ? 'elseIf' : directive.name;
  const value = (directive.exp as SimpleExpressionNode)?.content ?? 'true';

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
      loc: directive.loc,
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
