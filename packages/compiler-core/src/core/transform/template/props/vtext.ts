import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { createInterpolationNodeIR } from '../elements/node-creators';
import { resolveTemplateExp } from '../shared/resolve-str-exp';

export function handleVText(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const interpIR = createInterpolationNodeIR(exp.content);

  interpIR.babelExp = resolveTemplateExp(exp.content);
  nodeIR.children = [interpIR];
}
