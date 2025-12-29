import { strCodeTypes } from '@shared/string-code-types';
import { compileContext } from '@src/shared/compile-context';
import { logger } from '@src/shared/logger';
import { randomHash } from '@utils/random-hash';
import {
  DirectiveNode,
  ElementTypes,
  isVSlot,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { PropsIR, PropTypes } from '../props';
import { createPropsIR } from '../props/utils';
import { preParseProp } from './pre-parse-props';

export function findSameProp(source: ElementNodeIR['props'], target: PropsIR): PropsIR | undefined {
  const found = source.find(
    (p) =>
      p.isStatic &&
      target.isStatic &&
      p.type !== PropTypes.SLOT &&
      target.type !== PropTypes.SLOT &&
      p.name === target.name,
  );
  return found as PropsIR;
}

export function wrapSingleQuotes(content: string, condition?: boolean) {
  return condition || strCodeTypes.isStringLiteral(content) ? `'${content}'` : content;
}

export const isSlotElement = (node: VueElementNode): boolean => {
  if (node.tagType === ElementTypes.TEMPLATE) {
    if (node.props[0] !== undefined) {
      return isVSlot(node.props[0]);
    }
  }

  return node.tagType === ElementTypes.SLOT;
};

export function checkPropIsDynamicKey(prop: DirectiveNode) {
  const isKeyStatic = (prop.arg as SimpleExpressionNode)?.isStatic;
  const { source, filename } = compileContext.context;

  if (prop.rawName === 'v-bind' && !prop.name) {
    logger.warn('Keyless v-bind will overwrite all previously declared props at runtime.', {
      source,
      loc: prop.arg?.loc,
      file: filename,
    });
    return;
  }

  if (isKeyStatic === false) {
    logger.warn(
      'Failed to analyze dynamic prop. Falling back to source content; please use an explicit prop.',
      {
        source,
        loc: prop.arg?.loc,
        file: filename,
      },
    );
  }
}

export function addKeyToNode(nodeIR: ElementNodeIR) {
  const keyProp = createPropsIR('key', 'key', randomHash());
  keyProp.value.isStringLiteral = true;
  preParseProp(keyProp);
  nodeIR.props.push(keyProp);
}
