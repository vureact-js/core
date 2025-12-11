import * as t from '@babel/types';
import { ElementNodeIR } from '@core/transform/template/elements/node';
import { PropsIR, PropTypes } from '@core/transform/template/props';
import { SlotPropsIR } from '@core/transform/template/props/vslot';
import { parseFragmentExp } from '@shared/babel-utils';
import { JSXProp } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildProps(propsIR: ElementNodeIR['props']): JSXProp[] {
  const props: JSXProp[] = [];

  for (const prop of propsIR) {
    if (prop.type === PropTypes.SLOT) {
      const result = createSlotProp(prop as SlotPropsIR);
      if (result) props.push(result);
    } else {
      props.push(createProp(prop));
    }
  }

  return props;
}

function createSlotProp(propIR: SlotPropsIR) {
  // 转换阶段已确保插槽多节点包裹在一个 fragment 里
  const [slotRoot] = propIR.callback.exp;

  if (!slotRoot) return null;

  const key = t.jsxIdentifier(propIR.name);
  const jsxEl = buildElement(slotRoot);

  if (!propIR.isStatic) {
    const spread = parseFragmentExp(`{[${key}]: ${jsxEl}}`);
    return t.jsxSpreadAttribute(spread);
  }

  return t.jsxAttribute(key, jsxEl as t.JSXElement);
}

function createProp(propIR: PropsIR): JSXProp {
  const {
    isStatic,
    babelExp: { ast: keyAST },
    value: {
      babelExp: { ast: valueAST },
    },
  } = propIR;

  if (!isStatic) {
    // 转换阶段已处理成 {...[x]: v} 并保存在 keyAST
    return t.jsxSpreadAttribute(keyAST as t.Expression);
  }

  return t.jsxAttribute(keyAST as t.JSXIdentifier, buildJSXExpression(valueAST));
}
