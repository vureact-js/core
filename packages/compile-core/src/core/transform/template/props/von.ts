import { strCodeTypes } from '@src/shared/string-code-types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { createPropsIR } from './utils';

export function handleEvent(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  let expContent = exp.content.trim();

  const isCall = /\(*\)$/;
  // wrapped call expression or simple expression.
  // e.g. @click="handleClick()" or @click="count++"
  if (isCall.test(expContent) || !strCodeTypes.isSimpleExpression(expContent)) {
    expContent = `() => ${expContent}`;
  }

  const name = `on${camelCase(capitalize(arg.content))}`;
  const eventIR = createPropsIR(prop.rawName!, name, expContent);

  eventIR.type = PropTypes.EVENT;
  eventIR.isStatic = arg.isStatic;
  eventIR.modifiers = prop.modifiers.map((m) => m.content);

  // 事件修饰符交给运行时 vOn
  if (eventIR.modifiers.length) {
    const eventName = `${eventIR.name}.${eventIR.modifiers.join('.')}`;
    eventIR.name = eventName;
  }

  preParseProp(eventIR);

  nodeIR.props.push(eventIR);
}
