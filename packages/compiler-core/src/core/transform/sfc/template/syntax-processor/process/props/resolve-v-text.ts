import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/sfc/template';
import { createInterpolationNodeIR } from '@transform/sfc/template/shared/node-ir-utils';
import { resolveStringExpr } from '@transform/sfc/template/shared/resolve-string-expression';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVText(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = directive.exp as SimpleExpressionNode;
  const interpolationIR = createInterpolationNodeIR(exp.content);

  interpolationIR.babelExp = resolveStringExpr(exp.content, ctx);
  nodeIR.children = [interpolationIR];
}
