import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { createInterpolationNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVText(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = node.exp as SimpleExpressionNode;
  const interpolationIR = createInterpolationNodeIR(exp.content);

  interpolationIR.babelExp = resolveStringExpr(exp.content, ctx);
  nodeIR.children = [interpolationIR];
}
