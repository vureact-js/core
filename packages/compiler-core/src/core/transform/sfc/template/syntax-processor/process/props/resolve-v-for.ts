import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { DirectiveNode, ForParseResult, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR, LoopMeta } from '../resolve-element-node';

export function resolveVFor(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  _ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  nodeIR.meta.loop = {
    isLoop: true,
    isHandled: false,
    value: resolveForResult(node.forParseResult!),
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
