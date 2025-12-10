import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { createPropsIR } from './utils';

export function handleVShow(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const propIR = createPropsIR(':style', 'style', `{display: ${exp.content} ? '' : 'none'}`);
  preParseProp(propIR);
  nodeIR.props.push(propIR);
}
