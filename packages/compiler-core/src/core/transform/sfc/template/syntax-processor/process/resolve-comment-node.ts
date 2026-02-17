import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { createTextNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { CommentNode } from '@vue/compiler-core';

export function resolveCommentNode(
  node: CommentNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  childrenIR: TemplateChildNodeIR[],
) {
  const nodeIR = createTextNodeIR(node.content, true);
  nodeIR.babelExp = resolveStringExpr(nodeIR.content, ctx);

  childrenIR.push(nodeIR);
}
