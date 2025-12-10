import { compileContext } from '@shared/compile-context';
import { logger } from '@src/shared/logger';
import { strCodeTypes } from '@src/shared/string-code-types';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { createPropsIR } from './utils';

export function handleStaticIs(content: string, nodeIR: ElementNodeIR) {
  if (!content) return;

  if (content.startsWith('vue:')) {
    const name = content.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
  } else {
    const propIR = createPropsIR('is', 'is', content);
    propIR.value.isStringLiteral = true;
    preParseProp(propIR);
    nodeIR.props.push(propIR);
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
