import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { stringToExpr } from '@shared/babel-utils';
import { TemplateBlockIR } from '@transform/sfc/template';
import {
  createPropsIR,
  findSameProp,
  resolvePropAsBabelExp,
} from '@transform/sfc/template/shared/prop-ir-utils';
import { mergePropsIR } from '@transform/sfc/template/shared/prop-merge-utils';
import { resolveSpecialExpressions } from '@transform/sfc/template/shared/resolve-string-expression';
import { PropTypes } from '@transform/sfc/template/shared/types';
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
  let handler = resolveSpecialExpressions(exp.content.trim(), ctx);

  if (captureIndex > -1) {
    eventName = modifiers[captureIndex] ? `${eventName}Capture` : eventName;
    modifiers.splice(captureIndex, 1);
  }

  let originalVueEventName = '';

  if (modifiers.length) {
    originalVueEventName = `${arg.content}.${modifiers.join('.')}`;
  } else {
    const expr = stringToExpr(handler);

    // 如果值不是函数表达式也不是标识符，则需要函数包裹
    if (!t.isFunctionExpression(expr) && !t.isIdentifier(expr)) {
      handler = `() => {${handler}}`;
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
