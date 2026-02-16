import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@transform/template';
import { createInterpolationNodeIR } from '@transform/template/shared/node-ir-utils';
import { resolveStringExpr } from '@transform/template/shared/resolve-string-expression';
import { warnUnsupportedVueDollarVar } from '@transform/template/shared/warning-utils';
import { InterpolationNode, SimpleExpressionNode } from '@vue/compiler-core';

export function resolveInterpolationNode(
  node: InterpolationNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  childrenIR: TemplateChildNodeIR[],
) {
  const content = (node.content as SimpleExpressionNode).content;

  warnUnsupportedVueDollarVar(ctx, node);

  const nodeIR = createInterpolationNodeIR(content);
  nodeIR.babelExp = resolveStringExpr(nodeIR.content, ctx);

  childrenIR.push(nodeIR);
}
