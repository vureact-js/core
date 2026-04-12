import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/sfc/template';
import { createPropsIR, resolvePropAsBabelExp } from '@transform/sfc/template/shared/prop-ir-utils';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVHtml(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = directive.exp as SimpleExpressionNode;
  const propIR = createPropsIR('v-html', 'v-html', `{__html: ${exp.content}}`);

  resolvePropAsBabelExp(propIR, ctx);
  nodeIR.props.push(propIR);
}
