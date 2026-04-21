import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import {
  ConstantTypes,
  DirectiveNode,
  ElementNode as VueElementNode,
  ElementTypes as VueElementTypes,
  NodeTypes as VueNodeTypes,
} from '@vue/compiler-core';

/**
 * 处理 `<template :key="xx">`，将其 key 转移到内部第一个子节点
 */
export function resolveTemplateNodeKey(
  templNode: VueElementNode,
  keyContent: string,
  ctx: ICompilationContext,
) {
  const { filename, source } = ctx;
  const { children, loc } = templNode;

  // fix: https://github.com/vureact-js/core/issues/18
  if (children.length > 1) {
    // 要求用户使用一个父节点包裹
    logger.warn(
      'Expected <template> with `:key` to have a single parent element; otherwise, the key cannot be transferred to the first child.',
      {
        file: filename,
        source,
        loc,
      },
    );
    return;
  }

  // 获取 <template> 的第一个子节点
  const [firstChild] = children;

  // fix: https://github.com/vureact-js/core/issues/19
  if (
    firstChild?.type !== VueNodeTypes.ELEMENT ||
    firstChild.tagType === VueElementTypes.TEMPLATE ||
    firstChild.tagType === VueElementTypes.SLOT
  ) {
    return;
  }

  // 如果该子节点已存在 `:key` 则跳过
  const hasKeyProp = firstChild.props.some(
    (p) => p.type === VueNodeTypes.DIRECTIVE && p.name === 'key',
  );

  if (hasKeyProp) return;

  // 创建 :key="xx" ast 节点，并添加到子节点 props 中
  firstChild.props.push(createSimpleVueBind('key', keyContent));
}

/**
 * 创建简单的 v-bind ast 节点
 * @param name 绑定属性名
 * @param value 绑定属性值
 */
function createSimpleVueBind(name: string, value: string): DirectiveNode {
  return {
    type: VueNodeTypes.DIRECTIVE,
    name: 'bind',
    rawName: `:${name}`,
    exp: {
      type: VueNodeTypes.SIMPLE_EXPRESSION,
      content: value,
      isStatic: false,
      constType: ConstantTypes.NOT_CONSTANT,
      loc: {} as any,
    },
    arg: {
      type: VueNodeTypes.SIMPLE_EXPRESSION,
      content: name,
      isStatic: true,
      constType: ConstantTypes.CAN_STRINGIFY,
      loc: {} as any,
    },
    modifiers: [],
    loc: {} as any,
  };
}
