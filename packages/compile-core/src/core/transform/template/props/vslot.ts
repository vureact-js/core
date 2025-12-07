import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { ElementNodeIR } from '../nodes/element';
import { createPropsIR } from './utils';

// todo 如何链接插槽内容
export function handleVSlot(
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): void {
  // React 的「插槽」就是 props.children 或任意具名 props.xxx

  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const slot = createPropsIR(prop.rawName || '', arg.content, exp?.content ?? '');
  slot.type = PropTypes.SLOT;

  nodeIR.props.push(slot);
}
