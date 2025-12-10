import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { createPropsIR } from './utils';

export function handleVHtml(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  nodeIR.props.push(createPropsIR('v-html', 'v-html', `{__html: ${exp.content}}`));
}
