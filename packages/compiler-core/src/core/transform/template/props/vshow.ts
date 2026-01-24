import { ICompilationContext } from '@compiler/context/types';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { mergePropsIR } from '../shared/merge-props';
import { resolvePropAsBabelExp } from '../shared/resolve-prop-exp';
import { resolveTemplateExp } from '../shared/resolve-str-exp';
import { findSameProp } from '../shared/utils';
import { createPropsIR } from './utils';

export function handleVShow(ctx: ICompilationContext, prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const test = exp.content;
  const showIR = createPropsIR('v-show', 'style', `{display: ${test} ? '' : 'none'}`);

  resolvePropAsBabelExp(ctx, showIR);

  nodeIR.meta.show = {
    isShow: true,
    value: test,
    babelExp: {
      content: test,
      ast: resolveTemplateExp(ctx, test),
    },
  };

  const found = findSameProp(nodeIR.props, showIR);

  if (found) {
    mergePropsIR(ctx, found, showIR);
    return;
  }

  nodeIR.props.push(showIR);
}
