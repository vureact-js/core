import { strCodeTypes } from '@src/shared/string-code-types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { ElementNodeIR } from '../elements/element';
import { mergePropsIR } from '../shared/merge-props';
import { preParseProp } from '../shared/pre-parse-props';
import { findSameProp } from '../shared/utils';
import { createPropsIR } from './utils';

export function handleEvent(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const modifiers = prop.modifiers.map((m) => m.content);
  const hasCapture = modifiers.findIndex((mod) => mod === 'capture');

  let eventName = `on${camelCase(capitalize(arg.content))}`;
  let handler = exp.content.trim();

  if (hasCapture > -1) {
    // capture 模式 react 已有，无需参与运行时处理
    eventName = modifiers[hasCapture] ? `${eventName}Capture` : eventName;
    modifiers.splice(hasCapture, 1);
  }

  let vOnEvName = '';

  if (modifiers.length) {
    vOnEvName = `${arg.content}.${modifiers?.join('.')}`;
  } else {
    const isCall = /\(*\)$/;
    if (isCall.test(handler) || !strCodeTypes.isSimpleExpression(handler)) {
      // 非 vOn 处理的自调用/非函数需要包裹
      handler = `() => ${handler}`;
    }
  }

  // 创建事件IR
  const eventIR = createPropsIR(prop.rawName!, eventName, handler);

  eventIR.type = PropTypes.EVENT;
  eventIR.isStatic = arg.isStatic;
  eventIR.modifiers = modifiers;

  // 设置临时属性
  (eventIR as any).__vOnEvName = vOnEvName;

  preParseProp(eventIR);

  delete (eventIR as any).__vOnEvName;

  // 合并可能存在的重复事件
  const found = findSameProp(nodeIR.props, eventIR);
  if (found) {
    mergePropsIR(found, eventIR);
    return;
  }

  nodeIR.props.push(eventIR);
}
