import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { createInterpolationNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { warnUnsupportedVueDollarVar } from '@src/core/transform/sfc/template/shared/warning-utils';
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
