import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { createPropsIR } from './utils';

export function handleVHtml(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const propIR = createPropsIR('v-html', 'v-html', `{__html: ${exp.content}}`);
  preParseProp(propIR);
  nodeIR.props.push(propIR);
}
