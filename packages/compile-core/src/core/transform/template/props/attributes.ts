import { getContext } from '@core/transform/context';
import { strCodeTypes } from '@shared/getStrCodeBabelType';
import { AttributeNode, DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { enablePropsRuntimeAssistance } from '../../shared';
import { ElementNodeIR } from '../nodes/element';
import { PropsIR } from './index';
import { parseStyleString } from './style';
import { createPropsIR, isClassAttr, isStyleAttr } from './utils';

export function handleAttribute(prop: AttributeNode, nodeIR: ElementNodeIR) {
  const name = prop.name;
  const content = prop.value?.content ?? 'true';
  const attr = createPropsIR(name, name, content);

  // 特殊处理：ref 收集
  if (name === 'ref') {
    const { nodeRefs } = getContext();
    nodeRefs.add(content);
  }

  processAttributeIR(attr, nodeIR, false);
}

export function handleDynamicAttribute(prop: DirectiveNode, nodeIR: ElementNodeIR) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const name = arg?.content ?? '';
  const content = exp?.content;

  const dynamicAttr = createPropsIR(prop.rawName!, name, content, exp.isStatic);

  if (!name) dynamicAttr.isKeyLessVBind = true;

  dynamicAttr.isStatic = arg?.isStatic ?? true;

  processAttributeIR(dynamicAttr, nodeIR, true);
}

function processAttributeIR(attr: PropsIR, nodeIR: ElementNodeIR, isDynamic: boolean) {
  // 处理 style 属性的特殊情况
  if (attr.name === 'style') {
    attr.value.content = parseStyleString(attr.value.content);
  }

  // 查找已存在的同名属性
  const found = nodeIR.props.find((p) => p.name === attr.name && (!isDynamic || attr.isStatic));

  if (found) {
    mergeAttributeIR(found, attr);
    return;
  }

  // 动态属性需要启用运行时辅助
  if (isDynamic) {
    enablePropsRuntimeAssistance(attr);
  }

  nodeIR.props.push(attr);
}

function mergeAttributeIR(target: PropsIR, source: PropsIR) {
  const sourceContent = source.value.content;

  // 只有 class 和 style 需要合并
  if (isClassAttr(source.name)) {
    mergeClassAttribute(target, sourceContent);
    return;
  }

  if (isStyleAttr(source.name)) {
    mergeStyleAttribute(target, sourceContent);
    return;
  }

  // 非 class 和 style 直接覆盖最新值
  for (const key in source) {
    // @ts-ignore
    target[key] = source[key];
  }
}

function mergeClassAttribute(target: PropsIR, sourceContent: string) {
  // 简单值直接拼接合并
  if (strCodeTypes.isStringLiteral(sourceContent)) {
    target.value.content += ` + ${sourceContent}`;
    return;
  }

  // 复杂表达式需运行时 vBindCls 处理
  target.value.isBabelParseExp = false;
  target.value.combines = sourceContent;

  enablePropsRuntimeAssistance(target);
}

function mergeStyleAttribute(target: PropsIR, sourceContent: string) {
  if (sourceContent === '{}') return;

  const targetStyle = target.value.content;

  if (!target.value.combines) {
    // style combines 没有内容则说明总共只有2项需要合并
    target.value.combines = [targetStyle, sourceContent];
    // 使用 Object.assign
    target.value.content = `{Object.assign(${targetStyle}, ${sourceContent})}`;
    return;
  }

  const targetCombines = target.value.combines;

  // style combines 已有内容且使用数组保存，则总共3项需要合并
  if (Array.isArray(targetCombines)) {
    targetCombines.push(sourceContent);
    // 使用对象展开运算符
    target.value.content = `{${targetCombines.map((s) => `...${s}`).join(',')}}`;
  }
}
