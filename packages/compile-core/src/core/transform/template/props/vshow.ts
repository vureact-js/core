import { parseFragmentExp } from '@shared/babel-utils';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { findSameProp } from '../shared/utils';
import { mergePropsIR } from './merge';
import { createPropsIR } from './utils';

export function handleVShow(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const test = exp.content;
  const showIR = createPropsIR('v-show', 'style', `{display: ${test} ? '' : 'none'}`);

  preParseProp(showIR);

  nodeIR.meta.show = {
    isShow: true,
    value: test,
    babelExp: {
      content: test,
      ast: parseFragmentExp(test),
    },
  };

  const found = findSameProp(nodeIR.props, showIR);

  if (found) {
    mergePropsIR(found, showIR);
    return;
  }

  nodeIR.props.push(showIR);
}
