import {
  ConstantTypes,
  DirectiveNode,
  NodeTypes,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';

/**
 * 处理 `<template :key="xx">`，将其 key 转移到内部第一个子节点
 */
export function resolveTemplateNodeKey(vueNode: VueElementNode, keyContent: string) {
  // 获取 <template> 的第一个子节点
  const firstNode = vueNode.children[0] as VueElementNode;

  if (!firstNode) return;

  // 如果该子节点已存在 `:key` 则跳过
  const hasKeyProp = firstNode.props.some(
    (p) => p.type === NodeTypes.DIRECTIVE && p.name === 'key',
  );

  if (hasKeyProp) return;

  // 创建 :key="xx" ast 节点，并添加到子节点 props 中
  firstNode.props.push(createSimpleVueBind('key', keyContent));
}

/**
 * 创建简单的 v-bind ast 节点
 * @param name 绑定属性名
 * @param value 绑定属性值
 */
function createSimpleVueBind(name: string, value: string): DirectiveNode {
  return {
    type: NodeTypes.DIRECTIVE,
    name: 'bind',
    rawName: `:${name}`,
    exp: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: value,
      isStatic: false,
      constType: ConstantTypes.NOT_CONSTANT,
      loc: {} as any,
    },
    arg: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: name,
      isStatic: true,
      constType: ConstantTypes.CAN_STRINGIFY,
      loc: {} as any,
    },
    modifiers: [],
    loc: {} as any,
  };
}
