import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  createPropsIR,
  findSameProp,
  resolvePropAsBabelExp,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { mergePropsIR } from '@src/core/transform/sfc/template/shared/prop-merge-utils';
import { resolvePropContent } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { PropTypes } from '@src/core/transform/sfc/template/shared/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveVOn(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const arg = node.arg as SimpleExpressionNode;
  const exp = node.exp as SimpleExpressionNode;

  const modifiers = node.modifiers.map((item) => item.content);
  const captureIndex = modifiers.findIndex((modifier) => modifier === 'capture');

  let eventName = `on${camelCase(capitalize(arg.content))}`;
  let handler = resolvePropContent(exp.content.trim(), ctx);

  if (captureIndex > -1) {
    eventName = modifiers[captureIndex] ? `${eventName}Capture` : eventName;
    modifiers.splice(captureIndex, 1);
  }

  let originalVueEventName = '';

  if (modifiers.length) {
    originalVueEventName = `${arg.content}.${modifiers.join('.')}`;
  } else {
    const isCall = /\(*\)$/;

    if (isCall.test(handler) || !strCodeTypes.isSimpleExpression(handler)) {
      handler = `() => ${handler}`;
    }
  }

  const eventIR = createPropsIR(node.rawName!, eventName, handler);

  eventIR.type = PropTypes.EVENT;
  eventIR.isStatic = arg.isStatic;
  eventIR.modifiers = modifiers;

  (eventIR as any).__vOnEvName = originalVueEventName;

  resolvePropAsBabelExp(eventIR, ctx);

  delete (eventIR as any).__vOnEvName;

  const existing = findSameProp(nodeIR.props, eventIR);

  if (existing) {
    mergePropsIR(ctx, existing, eventIR);
    return;
  }

  nodeIR.props.push(eventIR);
}
