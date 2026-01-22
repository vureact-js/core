import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { logger } from '@src/shared/logger';
import { randomHash } from '@src/utils/hash';
import {
  isVSlot as __isVSlot,
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
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

export const isVSlot = (node: VueElementNode): boolean => {
  return !!(node.props[0] && __isVSlot(node.props[0]));
};

export function checkPropIsDynamicKey(ctx: ICompilationContext, prop: DirectiveNode) {
  const isKeyStatic = (prop.arg as SimpleExpressionNode)?.isStatic;
  const { source, filename } = ctx;

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

export function addKeyToNode(ctx: ICompilationContext, nodeIR: ElementNodeIR) {
  const keyProp = createPropsIR('key', 'key', randomHash());
  keyProp.value.isStringLiteral = true;
  preParseProp(ctx, keyProp);
  nodeIR.props.push(keyProp);
}
