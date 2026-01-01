import * as t from '@babel/types';
import { PropsIR, PropTypes } from '@core/transform/template/props';
import { SlotPropsIR } from '@core/transform/template/props/vslot';
import { parseTemplateExp } from '@shared/babel-utils';
import { TemplateChildNodeIR } from '@src/core/transform/template';
import { ElementNodeIR } from '@src/core/transform/template/elements/element';
import { buildChildren } from '..';
import { JSXChild, JSXProp } from '../types';
import { buildElement } from './element-builder';
import { buildJSXExpression } from './simple-builder';

export function buildProps(nodeIR: ElementNodeIR): JSXProp[] {
  const props: JSXProp[] = [];

  for (const prop of nodeIR.props) {
    // 处理插槽 prop
    if (prop.type === PropTypes.SLOT) {
      // 注意，这里的 prop 对象属于 SlotPropsIR

      const result = resolveSlotProp(prop as SlotPropsIR);

      if (result) {
        if (prop.name === 'children') {
          // children prop 的插槽内容直接覆盖当前的孩子节点
          // 通常 children 不会作为显式 prop 存在，在转换阶段会记录默认插槽 name 为 children
          nodeIR.children = result as unknown as TemplateChildNodeIR[]; // 此时 result 是一个 babel 节点
        } else {
          props.push(result as JSXProp);
        }
      }

      continue;
    }

    // 处理普通 prop
    props.push(resolveProp(prop));
  }

  return props;
}

function resolveSlotProp(
  slotIR: SlotPropsIR,
):
  | t.JSXAttribute
  | t.JSXSpreadAttribute
  | t.ArrowFunctionExpression
  | JSXChild
  | JSXChild[]
  | null {
  const keyId = t.jsxIdentifier(slotIR.name);

  const children: TemplateChildNodeIR[] | undefined = !slotIR.isScoped
    ? slotIR.content
    : slotIR.callback?.exp;

  let valueExp: t.ArrowFunctionExpression | JSXChild | JSXChild[] | null;

  if (!children?.length) return null;

  const jsx = children.length > 1 ? buildChildren(children, true) : buildElement(children[0]!);

  if (slotIR.isScoped) {
    const params = t.identifier(slotIR.callback!.arg);
    const fn = t.arrowFunctionExpression([params], jsx as t.Expression);
    valueExp = fn;
  } else {
    valueExp = jsx;
  }

  if (slotIR.name === 'children') {
    // 直接返回 babel 节点
    return valueExp;
  }

  if (!slotIR.isStatic) {
    const spread = parseTemplateExp(`{[${keyId}]: ${valueExp}}`);
    return t.jsxSpreadAttribute(spread);
  }

  return t.jsxAttribute(keyId, buildJSXExpression(valueExp as t.Expression));
}

function resolveProp(propIR: PropsIR): JSXProp {
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
    // 转换阶段已处理成 {...[x]: v} 并保存在 valueAST
    return t.jsxSpreadAttribute(valueAST as t.Expression);
  }

  let value;

  if (content !== 'true') {
    value = isStringLiteral ? t.stringLiteral(content) : buildJSXExpression(valueAST);
  }

  return t.jsxAttribute(keyAST as t.JSXIdentifier, value);
}
