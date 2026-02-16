import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@transform/template';
import { createTextNodeIR } from '@transform/template/shared/node-ir-utils';
import { resolveStringExpr } from '@transform/template/shared/resolve-string-expression';
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
