import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  createPropsIR,
  findSameProp,
  resolvePropAsBabelExp,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { mergePropsIR } from '@src/core/transform/sfc/template/shared/prop-merge-utils';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVShow(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = node.exp as SimpleExpressionNode;
  const test = exp.content;
  const showIR = createPropsIR('v-show', 'style', `{display: ${test} ? '' : 'none'}`);

  resolvePropAsBabelExp(showIR, ctx);

  nodeIR.meta.show = {
    isShow: true,
    value: test,
    babelExp: {
      content: test,
      ast: resolveStringExpr(test, ctx),
    },
  };

  const existing = findSameProp(nodeIR.props, showIR);

  if (existing) {
    mergePropsIR(ctx, existing, showIR);
    return;
  }

  nodeIR.props.push(showIR);
}
