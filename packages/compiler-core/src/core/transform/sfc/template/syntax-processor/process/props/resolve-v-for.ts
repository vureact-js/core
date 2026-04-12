import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/sfc/template';
import { DirectiveNode, ForParseResult, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR, LoopMeta } from '../resolve-element-node';

export function resolveVFor(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  nodeIR.meta.loop = {
    isLoop: true,
    isHandled: false,
    value: resolveForResult(directive.forParseResult!),
  };
}

function resolveForResult(forParseResult: ForParseResult): LoopMeta['value'] {
  const source = (forParseResult.source as SimpleExpressionNode)?.content;
  const value = (forParseResult.value as SimpleExpressionNode)?.content;
  const index = (forParseResult.index as SimpleExpressionNode)?.content;
  const key = (forParseResult.key as SimpleExpressionNode)?.content;

  return {
    source,
    value,
    index,
    key,
  };
}
