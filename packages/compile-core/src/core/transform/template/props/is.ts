import { compileContext } from '@shared/compile-context';
import { strCodeTypes } from '@shared/getStrCodeBabelType';
import { logger } from '@src/shared/logger';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../nodes/element';
import { createPropsIR } from './utils';

export function handleStaticIs(content: string, nodeIR: ElementNodeIR) {
  if (!content) return;

  if (content.startsWith('vue:')) {
    const name = content.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
  } else {
    nodeIR.props.push(createPropsIR('is', 'is', content));
  }
}

export function handleDynamicIs(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const exp = prop.exp as SimpleExpressionNode;

  if (strCodeTypes.isStringLiteral(exp.content)) {
    handleStaticIs(exp.content, nodeIR);
    return;
  }

  if (strCodeTypes.isIdentifier(exp.content)) {
    nodeIR.tag = camelCase(exp.content);
    return;
  }

  const { source, filename } = compileContext.context;

  logger.error('The expected type of v-bind:is is string or Component (identifier).', {
    loc: prop.loc,
    file: filename,
    source,
  });
}
