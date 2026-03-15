import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  createPropsIR,
  resolvePropAsBabelExp,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { PropTypes } from '@src/core/transform/sfc/template/shared/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import {
  AttributeNode,
  DirectiveNode,
  ElementTypes,
  NodeTypes,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { PropsIR } from './resolve-props';

type HTMLInputType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url';

export function resolveVModel(
  node: DirectiveNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  elementNode: VueElementNode,
  nodeIR: ElementNodeIR,
) {
  const arg = node.arg as SimpleExpressionNode;
  const exp = node.exp as SimpleExpressionNode;
  const modifiers = node.modifiers.map((item) => item.content);

  const getterName = exp.content;
  const isComponent = elementNode.tagType === ElementTypes.COMPONENT;
  const inputType = resolveHtmlInput(elementNode, isComponent);
  const propName = arg?.content ?? resolveModelPropName(inputType, isComponent);

  let valuePropIR: PropsIR;
  let eventPropIR: PropsIR;

  if (isComponent) {
    // ==========================================
    // 方案1：组件模式的 v-model 转换
    // ==========================================
    valuePropIR = createPropsIR('v-model', propName, getterName);

    // 事件名必须基于 propName（如 modelValue / value / status），
    // 不能使用绑定变量名（如 keyword），否则会生成错误的 onUpdateKeyword
    const eventReactName = `onUpdate${capitalize(camelCase(propName))}`;
    const eventVueName = `update:${propName}`;

    const isTS = ctx.scriptData?.lang?.startsWith('ts');
    const valueArg = isTS ? 'value: any' : 'value';

    // 生成处理后的值表达式
    const processedValue = applyValueModifiers('value', modifiers);
    const handlerBody = `(${valueArg}) => { ${getterName} = ${processedValue} }`;

    eventPropIR = createPropsIR(eventVueName, eventReactName, handlerBody);
    eventPropIR.type = PropTypes.EVENT;
  } else {
    // ==========================================
    // 方案2：原生 HTML 元素的 v-model 转换
    // ==========================================
    if (inputType === 'radio') {
      // Radio 特殊处理：绑定 checked，触发 onChange
      const radioValue = getRadioValue(elementNode);
      valuePropIR = createPropsIR('v-model', 'checked', `${getterName} === ${radioValue}`);

      const processedValue = applyValueModifiers(radioValue, modifiers);
      const handlerBody = `() => { ${getterName} = ${processedValue} }`;

      eventPropIR = createPropsIR('v-model', 'onChange', handlerBody);
    } else {
      // Text, Checkbox, Select, Textarea 等处理
      valuePropIR = createPropsIR('v-model', propName, getterName);

      // .lazy 修饰符使用 onBlur
      const eventName = modifiers.includes('lazy') ? 'onBlur' : 'onChange';
      const isCheckbox = inputType === 'checkbox';
      const rawValueExp = isCheckbox ? 'e.target.checked' : 'e.target.value';

      const processedValue = applyValueModifiers(rawValueExp, modifiers);
      const handlerBody = `(e) => { ${getterName} = ${processedValue} }`;

      eventPropIR = createPropsIR('v-model', eventName, handlerBody);
    }

    eventPropIR.type = PropTypes.EVENT;
  }

  // 通过 Babel 表达式转换并推入 NodeIR
  resolvePropAsBabelExp(valuePropIR, ctx);
  resolvePropAsBabelExp(eventPropIR, ctx);

  nodeIR.props.push(valuePropIR, eventPropIR);
}

// =========================================================
// 辅助工具函数区
// =========================================================

function resolveModelPropName(inputType?: HTMLInputType, isComponent = false): string {
  if (inputType === 'checkbox' || inputType === 'radio') {
    return 'checked';
  }
  return !isComponent ? 'value' : 'modelValue';
}

function getRadioValue(elementNode: VueElementNode): string {
  const valueAttr = elementNode.props.find(
    (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'value',
  ) as AttributeNode | undefined;

  if (!valueAttr?.value?.content) return '""';

  const content = valueAttr.value.content;
  return /^['"]/.test(content) ? content : `"${content}"`;
}

function resolveHtmlInput(node: VueElementNode, isComponent: boolean): HTMLInputType | undefined {
  if (isComponent) return;

  if (node.tag !== 'input') return node.tag as HTMLInputType;

  const typeProp = node.props.find(
    (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'type',
  ) as AttributeNode | undefined;

  return typeProp?.value?.content?.toLowerCase() as HTMLInputType;
}

/**
 * 修饰符包装管道
 * 按照 Vue 官方处理顺序，依次对取值表达式进行包装，替代危险的全局 replace 替换
 */
function applyValueModifiers(valueExp: string, modifiers: string[]): string {
  let result = valueExp;

  // 1. 处理 .trim 修饰符
  if (modifiers.includes('trim')) {
    result = `${result}?.trim()`;
  }

  // 2. 处理 .number 修饰符
  if (modifiers.includes('number')) {
    result = `Number(${result})`;
  }

  return result;
}
