import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  createPropsIR,
  resolvePropAsBabelExp,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVHtml(
  node: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = node.exp as SimpleExpressionNode;
  const propIR = createPropsIR('v-html', 'v-html', `{__html: ${exp.content}}`);

  resolvePropAsBabelExp(propIR, ctx);
  nodeIR.props.push(propIR);
}
