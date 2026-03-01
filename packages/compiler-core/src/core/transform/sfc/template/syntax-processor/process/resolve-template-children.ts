import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { isTemplateVSlotNode } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import {
  isSlotOutlet,
  NodeTypes as VueNodeTypes,
  ParentNode as VueParentNode,
  RootNode as VueRootNode,
} from '@vue/compiler-core';
import { resolveCommentNode } from './resolve-comment-node';
import { ElementNodeIR, resolveElementNode } from './resolve-element-node';
import { resolveInterpolationNode } from './resolve-interpolation-node';
import { resolveSlotOutletNode } from './resolve-slot-outlet-node';
import { resolveTemplateVSlotNode } from './resolve-template-v-slot-node';
import { resolveTextNode } from './resolve-text-node';

export function resolveTemplateChildren(
  node: VueRootNode,
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  resolveChildNodes(node, nodeIR, ctx, null, nodeIR.children);
}

export function resolveChildNodes(
  node: VueParentNode,
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  childrenIR: TemplateChildNodeIR[],
) {
  // 遍历当前节点的所有子节点
  for (const child of node.children) {
    // 处理元素节点
    if (child.type === VueNodeTypes.ELEMENT) {
      // 处理插槽出口（<slot> 标签）
      if (isSlotOutlet(child)) {
        resolveSlotOutletNode(child, nodeIR, ctx, parentIR, childrenIR);
        continue;
      }

      // 处理模板插槽（<template v-slot>）
      if (isTemplateVSlotNode(child)) {
        if (parentIR) {
          resolveTemplateVSlotNode(child, nodeIR, ctx, parentIR);
        }
        continue;
      }

      // 处理普通元素节点
      const elementIR = resolveElementNode(child, nodeIR, ctx, childrenIR as ElementNodeIR[]);

      // 将生成的元素IR添加到子节点列表中
      childrenIR.push(elementIR);

      // 如果当前元素有子节点，递归处理
      if (child.children.length) {
        resolveChildNodes(child, nodeIR, ctx, elementIR, elementIR.children);
      }

      continue;
    }

    // 处理插值表达式节点（{{ expression }}）
    if (child.type === VueNodeTypes.INTERPOLATION) {
      resolveInterpolationNode(child, nodeIR, ctx, childrenIR);
      continue;
    }

    // 处理文本节点
    if (child.type === VueNodeTypes.TEXT) {
      resolveTextNode(child, nodeIR, ctx, childrenIR);
      continue;
    }

    // 处理注释节点
    if (child.type === VueNodeTypes.COMMENT) {
      resolveCommentNode(child, nodeIR, ctx, childrenIR);
    }
  }

  return nodeIR
}
