import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../nodes/element';
import { createPropsIR } from './utils';

export function handleVShow(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  nodeIR.props.push(
    createPropsIR(':style', 'style', `{display: ${exp.content} ? '' : 'none'}`),
  );
}
