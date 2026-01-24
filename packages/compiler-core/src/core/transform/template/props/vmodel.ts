import { ICompilationContext, IRModelEventHandler } from '@compiler/context/types';
import { capitalize } from '@utils/capitalize';
import {
  AttributeNode,
  DirectiveNode,
  ElementTypes,
  NodeTypes,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { PropsIR } from '.';
import { ElementNodeIR } from '../elements/element';
import { resolvePropAsBabelExp } from '../shared/resolve-prop-exp';
import { extractFirstIdentifier } from '../shared/resolve-str-exp';
import { createPropsIR } from './utils';

export type InputType = 'text' | 'checkbox' | 'radio' | 'select' | 'textarea';

export function handleVModel(
  ctx: ICompilationContext,
  prop: DirectiveNode,
  node: VueElementNode,
  nodeIR: ElementNodeIR,
) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const getterName = exp.content;

  const isComp = node.tagType === ElementTypes.COMPONENT;

  const inputType = getInputType(node, isComp);

  const propName = arg?.content ?? getPropName(inputType, isComp);

  const propsIR = createPropsIR('v-model', propName, getterName);

  const eventIR = handleEventIR(
    ctx,
    getterName,
    inputType,
    prop.modifiers.map((m) => m.content),
    isComp,
  );

  resolvePropAsBabelExp(ctx, propsIR);
  resolvePropAsBabelExp(ctx, eventIR);

  nodeIR.props.push(propsIR, eventIR);
}

function getPropName(inputType?: InputType, isComp = false): string {
  if (inputType === 'checkbox' || inputType === 'radio') {
    return 'checked';
  }
  return !isComp ? 'value' : 'modelValue';
}

function handleEventIR(
  ctx: ICompilationContext,
  getterName: string,
  inputType?: InputType,
  modifiers: string[] = [],
  isComp = false,
): PropsIR {
  // 首先提取基础标识符（防止用户写了链式访问）
  const _getterName = extractFirstIdentifier(getterName)!;
  const rawName = `update:${_getterName}`;

  const propName = getEventPropName(_getterName, inputType, modifiers, isComp);
  const setterName = `set${capitalize(_getterName)}`;

  // 值提取器（e.target.value / e.target.checked 等）
  const valueExtractor = getValueExtractor(inputType, isComp);
  // 修饰符处理器（trim / number / lazy）
  const processedValue = applyModifiers(valueExtractor, modifiers);

  createVModelHandler(ctx, getterName, setterName, processedValue);

  // v-model="bar" -> bar + onBarChange
  return createPropsIR(rawName, propName, setterName);
}

function getEventPropName(
  getterName: string,
  inputType?: InputType,
  modifiers: string[] = [],
  isComp = false,
): string {
  // lazy 修饰符强制 onChange
  if (modifiers.includes('lazy')) return 'onChange';

  // 文本类用 onInput（实时更新）
  if (inputType === 'textarea' || (!isComp && isTextInput(inputType))) {
    return 'onInput';
  }

  // 非组件用 onChange，否则使用 onUpdate[GetterName]
  return !isComp ? 'onChange' : `onUpdate${capitalize(getterName)}`;
}

function getValueExtractor(inputType?: InputType, isComp = false): string {
  const extractors: Record<InputType | 'default', string> = {
    checkbox: 'e.target.checked',
    radio: 'e.target.value',
    select: 'e.target.value',
    textarea: 'e.target.value',
    text: 'e.target.value',
    default: 'e.target.value',
  };

  return !isComp ? extractors[inputType || 'default'] : 'e';
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

function getInputType(node: VueElementNode, isComp: boolean): InputType | undefined {
  if (isComp) return;

  if (node.tag !== 'input') {
    // textarea, select
    return node.tag as InputType;
  }

  const typeProp = node.props.find((p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'type') as
    | AttributeNode
    | undefined;

  if (!typeProp) return;

  return typeProp.value?.content.toLowerCase() as InputType;
}

function isTextInput(type?: string): boolean {
  if (!type) return true; // 默认 text
  return ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes(type);
}

function createVModelHandler(
  ctx: ICompilationContext,
  getterName: string,
  setterName: string,
  processedValue: string,
) {
  const { models } = ctx.templateData;
  const _getterName = extractFirstIdentifier(getterName)!;
  const handlerName = `on${capitalize(_getterName)}Change`;

  const handler: IRModelEventHandler = {
    key: getterName,
    handler: {
      name: handlerName,
      exp: {
        arg: 'e',
        body: {
          setterExp: {
            name: setterName,
            arg: _getterName,
            body: `${getterName}=${processedValue}`,
          },
        },
      },
    },
  };

  let exists = models.findLastIndex((t) => t.key === handler.key);
  if (exists !== -1) {
    handler.handler.name += ++exists;
  }

  // 收集到编译上下文中，后续在 script 转换中处理它，
  // 生成例如：useCallback((e) => {setBar((state) => {xxx; return state;}))}, [])
  models.push(handler);
}
