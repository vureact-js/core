import { getContext } from '@core/transform/context';
import { createVModelEvName } from '@core/transform/utils';
import { logger } from '@shared/logger';
import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import { capitalize } from '@utils/capitalize';
import {
  DirectiveNode,
  ElementTypes,
  NodeTypes,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { PropsIR } from '.';
import { ElementNodeIR } from '../nodes/element';
import { createPropsIR } from './utils';

export type InputType = 'text' | 'checkbox' | 'radio' | 'select' | 'textarea';

export function handleVModel(prop: DirectiveNode, node: VueElementNode, nodeIR: ElementNodeIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  // 只允许使用变量标识符
  if (!strCodeTypes.isIdentifier(exp.content)) {
    const { source, filename } = getContext();

    logger.error('v-model value must be a valid JavaScript variable identifier.', {
      loc: prop.loc,
      file: filename,
      source,
    });

    return;
  }

  // 识别元素类型
  const isComponent = node.tagType === ElementTypes.COMPONENT;
  const inputType = !isComponent ? getInputType(node) : undefined;

  const name = arg?.content ?? getModelPropName(inputType);

  // 解析目标（value 变量名 和 setter 函数名）
  const { varName, setterName } = parseModelTarget(exp.content);

  nodeIR.props.push(createPropsIR('v-model', name, varName, exp.isStatic));

  const modifiers = prop.modifiers.map((m) => m.content);
  const eventBlock = createModelEventIR(setterName, inputType, modifiers);

  // 由于 v-model 只能接受变量名，因此可以作为 update 函数名
  if (isComponent) eventBlock.name = createVModelEvName(name);

  nodeIR.props.push(eventBlock);
}

function parseModelTarget(valueExp: string): { varName: string; setterName: string } {
  // Vue: v-model="foo" → React: foo + setFoo
  // 策略1：假设用户用 useState，自动推导 setter
  const setterName = `set${capitalize(valueExp)}`;

  return { varName: valueExp, setterName };
}

function getModelPropName(inputType?: InputType): string {
  if (inputType === 'checkbox' || inputType === 'radio') {
    return 'checked';
  }
  return 'value';
}

function createModelEventIR(
  setterName: string,
  inputType?: InputType,
  modifiers: string[] = [],
): PropsIR {
  const eventName = getModelEventName(inputType, modifiers);

  // 值提取器（e.target.value / e.target.checked 等）
  const valueExtractor = getValueExtractor(inputType);

  // 修饰符处理器（trim / number / lazy）
  const processedValue = applyModifiers(valueExtractor, modifiers);

  // 生成箭头函数体（字符串形式，但由结构化数据组装）
  const handlerBody = `${setterName}(${processedValue})`;

  return createPropsIR(eventName, eventName, `e => ${handlerBody}`, false);
}

function getModelEventName(inputType?: InputType, modifiers: string[] = []): string {
  // lazy 修饰符强制 onChange
  if (modifiers.includes('lazy')) return 'onChange';

  // 文本类用 onInput（实时更新）
  if (inputType === 'textarea' || isTextInputType(inputType)) {
    return 'onInput';
  }

  // 其他用 onChange
  return 'onChange';
}

function getValueExtractor(inputType?: InputType): string {
  const extractors: Record<InputType | 'default', string> = {
    checkbox: 'e.target.checked',
    radio: 'e.target.value',
    select: 'e.target.value',
    textarea: 'e.target.value',
    text: 'e.target.value',
    default: 'e.target.value',
  };

  return extractors[inputType || 'default'];
}

function applyModifiers(valueExtractor: string, modifiers: string[]): string {
  let expr = valueExtractor;

  // trim 修饰符
  if (modifiers.includes('trim')) {
    expr = `${expr}.trim()`;
  }

  // number 修饰符（Vue 核心规则：空字符串不转换）
  if (modifiers.includes('number')) {
    expr = `(${expr} ? Number(${expr}) : '')`;
  }

  return expr;
}

function getInputType(node: VueElementNode): InputType | undefined {
  if (node.tag !== 'input') return node.tag as InputType; // textarea, select

  const typeProp = node.props.find(
    (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'type',
  ) as any;

  return typeProp?.value?.content?.toLowerCase() as InputType | undefined;
}

function isTextInputType(type?: string): boolean {
  if (!type) return true; // 默认 text
  return ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes(type);
}
