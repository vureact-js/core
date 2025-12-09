import { strCodeTypes } from '@src/shared/string-code-types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { PropTypes } from '.';
import { enablePropsRuntimeAssistance } from '../../shared';
import { ElementNodeIR } from '../nodes/element';
import { createPropsIR } from './utils';

export function handleEvent(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  let expContent = exp.content.trim();

  // 包装调用表达式 @click="count++" 或者 @click="handleClick"
  if (strCodeTypes.isCallExpression(expContent) || !strCodeTypes.isSimpleExpression(expContent)) {
    expContent = `() => ${expContent}`;
  }

  const name = `on${camelCase(capitalize(arg.content))}`;
  const event = createPropsIR(prop.rawName!, name, expContent);

  event.type = PropTypes.EVENT;
  event.isStatic = arg.isStatic;
  event.modifiers = prop.modifiers.map((m) => m.content);

  // 修饰符交给运行时 vOn
  if (event.modifiers.length) {
    event.name = `${event.name}.${event.modifiers.join('.')}`;
    enablePropsRuntimeAssistance(event);
  }

  nodeIR.props.push(event);
}
