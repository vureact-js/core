import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { strCodeTypes } from '@src/shared/string-code-types';
import { capitalize } from '@utils/capitalize';
import {
  DirectiveNode,
  ElementTypes,
  NodeTypes,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { PropsIR } from '.';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { createPropsIR } from './utils';

export type InputType = 'text' | 'checkbox' | 'radio' | 'select' | 'textarea';

export function handleVModel(prop: DirectiveNode, node: VueElementNode, nodeIR: ElementNodeIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  // 只允许使用变量标识符
  if (!strCodeTypes.isIdentifier(exp.content)) {
    const { source, filename } = compileContext.context;

    logger.error('v-model value must be a valid JavaScript variable identifier.', {
      loc: prop.loc,
      file: filename,
      source,
    });

    return;
  }

  // 识别元素类型
  const isComponent = node.tagType === ElementTypes.COMPONENT;
  const inputType = getInputType(node, isComponent);
  const name = arg?.content ?? getModelPropName(inputType, isComponent);

  // 解析目标（value 变量名 和 setter 函数名）
  const { varName, setterName } = parseModelTarget(exp.content);

  const propIR = createPropsIR('v-model', name, varName);

  const eventIR = createModelEventIR(
    setterName,
    inputType,
    prop.modifiers.map((m) => m.content),
    isComponent,
  );

  preParseProp(propIR);
  preParseProp(eventIR);

  nodeIR.props.push(propIR);
  nodeIR.props.push(eventIR);
}

function parseModelTarget(valueExp: string): { varName: string; setterName: string } {
  // Vue: v-model="foo" → React: foo + setFoo
  // 策略1：假设用户用 useState，自动推导 setter
  const setterName = `set${capitalize(valueExp)}`;

  return { varName: valueExp, setterName };
}

function getModelPropName(inputType?: InputType, isComponent = false): string {
  if (inputType === 'checkbox' || inputType === 'radio') {
    return 'checked';
  }
  return !isComponent ? 'value' : 'modelValue';
}

function createModelEventIR(
  setterName: string,
  inputType?: InputType,
  modifiers: string[] = [],
  isComponent = false,
): PropsIR {
  const eventName = getModelEventName(inputType, modifiers, isComponent);

  // 值提取器（e.target.value / e.target.checked 等）
  const valueExtractor = getValueExtractor(inputType);

  // 修饰符处理器（trim / number / lazy）
  const processedValue = applyModifiers(valueExtractor, modifiers);

  // 生成箭头函数体（字符串形式，但由结构化数据组装）
  const handlerBody = `${setterName}(${processedValue})`;

  return createPropsIR(eventName, eventName, `e => ${handlerBody}`);
}

function getModelEventName(
  inputType?: InputType,
  modifiers: string[] = [],
  isComponent = false,
): string {
  // lazy 修饰符强制 onChange
  if (modifiers.includes('lazy')) return 'onChange';

  // 文本类用 onInput（实时更新）
  if (inputType === 'textarea' || (!isComponent && isTextInputType(inputType))) {
    return 'onInput';
  }

  // 其他非组件节点则用 onChange，否则使用 onUpdateModelValue
  return !isComponent ? 'onChange' : 'onUpdateModelValue';
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
    expr = `(${expr} ? parseFloat(${expr}) : '')`;
  }

  return expr;
}

function getInputType(node: VueElementNode, isComponent: boolean): InputType | undefined {
  if (isComponent) return;
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
