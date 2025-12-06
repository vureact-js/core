import { getContext } from '@core/transform/context';
import { AttributeNode, DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { enablePropsRuntimeAssistance } from '../../shared';
import { ElementNodeIR } from '../nodes/element';
import { PropsIR, PropTypes } from './index';
import { handleDynamicIs, handleStaticIs } from './is';
import { mergeAttributeIR } from './merge';
import { parseStyleString } from './style';
import { createPropsIR } from './utils';

export function handleAttribute(prop: AttributeNode, nodeIR: ElementNodeIR) {
  const name = prop.name;
  const content = prop.value?.content ?? 'true';

  // 特殊处理：is
  if (name === 'is') {
    handleStaticIs(content, nodeIR);
    return;
  }

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

  // 特殊处理：is
  if (name === 'is') {
    handleDynamicIs(prop, nodeIR);
    return;
  }

  const dynamicAttr = createPropsIR(prop.rawName!, name, content, exp.isStatic);

  if (!name) dynamicAttr.isKeyLessVBind = true;

  dynamicAttr.type = PropTypes.DYNAMIC_ATTRIBUTE;
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
