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

  // fix: Vue 事件名转 React 事件 props：
  // 例如 `update:modelValue` -> `onUpdateModelValue`
  let eventName = normalizeVOnEventName(arg.content);
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

    // fix: 仅当表达式不是“函数引用/函数表达式”时，才包一层事件回调函数
    if (
      !t.isFunctionExpression(expr) &&
      !t.isArrowFunctionExpression(expr) &&
      !t.isIdentifier(expr)
    ) {
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

function normalizeVOnEventName(rawEventName: string): string {
  const segments = rawEventName
    .split(/[:-]/g)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalized = segments.map((segment) => capitalize(camelCase(segment))).join('');

  return `on${normalized}`;
}
