import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { IsComponent } from '@src/core/transform/shared/setup-runtime-utils';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { preParseProp } from '../shared/pre-parse-props';
import { createPropsIR } from './utils';

export function handleStaticIs(ctx: ICompilationContext, content: string, nodeIR: ElementNodeIR) {
  if (!content) return;

  if (content.startsWith('vue:')) {
    const name = content.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
    return;
  }

  const propIR = createPropsIR('is', 'is', content);

  propIR.value.isStringLiteral = true;

  preParseProp(ctx, propIR);
  nodeIR.props.push(propIR);
}

export function handleDynamicIs(
  ctx: ICompilationContext,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
) {
  const exp = prop.exp as SimpleExpressionNode;
  const is = exp.content;

  if (strCodeTypes.isStringLiteral(is)) {
    handleStaticIs(ctx, is, nodeIR);
    return;
  }

  const propIR = createPropsIR('is', 'is', is);

  preParseProp(ctx, propIR);

  nodeIR.tag = IsComponent(ctx);
  nodeIR.isComponent = true;
  nodeIR.props.push(propIR);
}
