import { DirectiveNode, ForParseResult, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR, LoopMeta } from '../elements/element';

export function handleVFor(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  nodeIR.meta.loop = {
    isLoop: true,
    isHandled: false,
    value: getForResult(prop.forParseResult!),
  };
  // loop node 较特殊，在转换阶段不参与预解析
}

function getForResult(forParseResult: ForParseResult): LoopMeta['value'] {
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
