import { ICompilationContext } from '@compiler/context/types';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { resolvePropAsBabelExp } from '../shared/resolve-prop-exp';
import { createPropsIR } from './utils';

export function handleVHtml(ctx: ICompilationContext, prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const propIR = createPropsIR('v-html', 'v-html', `{__html: ${exp.content}}`);
  resolvePropAsBabelExp(ctx, propIR);
  nodeIR.props.push(propIR);
}
