import { IsComponent } from '@shared/runtime-utils';
import { strCodeTypes } from '@shared/string-code-types';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse-props';
import { createPropsIR } from './utils';

export function handleStaticIs(content: string, nodeIR: ElementNodeIR) {
  if (!content) return;

  if (content.startsWith('vue:')) {
    const name = content.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
    return;
  }

  const propIR = createPropsIR('is', 'is', content);

  propIR.value.isStringLiteral = true;

  preParseProp(propIR);
  nodeIR.props.push(propIR);
}

export function handleDynamicIs(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;
  const is = exp.content;

  if (strCodeTypes.isStringLiteral(is)) {
    handleStaticIs(is, nodeIR);
    return;
  }

  const propIR = createPropsIR('is', 'is', is);

  preParseProp(propIR);

  nodeIR.tag = IsComponent();
  nodeIR.isComponent = true;
  nodeIR.props.push(propIR);
}
