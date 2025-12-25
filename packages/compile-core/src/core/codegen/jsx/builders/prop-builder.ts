import * as t from '@babel/types';
import { ElementNodeIR } from '@core/transform/template/elements/node';
import { PropsIR, PropTypes } from '@core/transform/template/props';
import { SlotPropsIR } from '@core/transform/template/props/vslot';
import { parseTemplateExp } from '@shared/babel-utils';
import { buildChildren } from '..';
import { JSXProp } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildProps(propsIR: ElementNodeIR['props']): JSXProp[] {
  const props: JSXProp[] = [];

  for (const prop of propsIR) {
    if (prop.type === PropTypes.SLOT) {
      const result = buildSlot(prop as SlotPropsIR);
      if (result) props.push(result);
    } else {
      props.push(createProp(prop));
    }
  }

  return props;
}

function buildSlot(propIR: SlotPropsIR) {
  // 转换阶段已确保插槽多节点包裹在一个 fragment 里
  const children = propIR.callback.exp;
  const params = propIR.callback.arg;

  if (!children.length) return null;

  const key = t.jsxIdentifier(propIR.name);
  const jsx = children.length > 1 ? buildChildren(children, true) : buildElement(children[0]!);

  // 插槽 prop 统一转换成 () => JSXChild
  const render = t.arrowFunctionExpression([t.identifier(params)], jsx as t.Expression);

  if (!propIR.isStatic) {
    const spread = parseTemplateExp(`{[${key}]: ${render}}`);
    return t.jsxSpreadAttribute(spread);
  }

  return t.jsxAttribute(key, buildJSXExpression(render as t.Expression));
}

function createProp(propIR: PropsIR): JSXProp {
  const {
    isStatic,
    isKeyLessVBind,
    babelExp: { ast: keyAST },
    value: {
      content,
      isStringLiteral,
      babelExp: { ast: valueAST },
    },
  } = propIR;

  if (!isStatic || isKeyLessVBind) {
    // 转换阶段已处理成 {...[x]: v} 并保存在 keyAST
    return t.jsxSpreadAttribute(valueAST as t.Expression);
  }

  let value;

  if (content !== 'true') {
    value = isStringLiteral ? t.stringLiteral(content) : buildJSXExpression(valueAST);
  }

  return t.jsxAttribute(keyAST as t.JSXIdentifier, value);
}
