import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { handleAttributeBlock } from './attributes';
import { PropsIR } from '.';

export function handleVHtml(prop: DirectiveNode, propsIR: PropsIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  handleAttributeBlock({
    propsIR,
    name: 'v-html',
    value: `{__html: ${exp.content}}`,
    isStaticKey: arg?.isStatic ?? true,
    isStaticValue: exp?.isStatic ?? true,
  });
}
