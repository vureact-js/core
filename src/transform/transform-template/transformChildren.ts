import * as t from '@babel/types';
import { VUE_DIR } from '@constants/vue';
import { Fragment } from '@transform/constants';
import { isNull, isUndefined } from '@utils/types';
import { ElementTypes, NodeTypes } from '@vue/compiler-core';
import { buildConditionalExpressionFromArray } from './buildExpression';
import { Conditionals } from './constants';
import {
  transformBuildInElement,
  transformElement,
  transformVPreElement,
} from './transformElement';
import { transformInterpolation } from './transformInterpolation';
import { transformProps } from './transformProps';
import type {
  ExtendedDirectiveNode,
  ExtendedElementNode,
  ExtendedInterpolationNode,
  ExtendedNode,
  ExtendJSXNode,
} from './types';

export function transformChildren(
  nodes: ExtendedNode[],
  parent?: ExtendedElementNode,
): ExtendJSXNode[] {
  const results: ExtendJSXNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isUndefined(node)) break;

    const transformedNode = transformChildNode(node, nodes, i, parent);

    if (!isNull(transformedNode)) {
      const { node, skipCount } = transformedNode;
      if (Array.isArray(node)) {
        results.push(...node);
      } else {
        results.push(node);
      }

      // 如果是条件链节点，更新索引跳过已处理的节点
      if (skipCount && skipCount > 0) {
        i += skipCount - 1;
      }
    }
  }

  return results;
}

// 统一子节点转换结果类型
interface TransformResult {
  node: ExtendJSXNode | ExtendJSXNode[];
  skipCount?: number; // 对于条件链，表示跳过的节点数
}

/**
 * 转换单个子节点
 */
function transformChildNode(
  node: ExtendedNode,
  nodes: ExtendedNode[],
  index: number,
  parent?: ExtendedElementNode,
): TransformResult | null {
  switch (node.type) {
    case NodeTypes.ELEMENT:
      return transformElementNode(node as ExtendedElementNode, nodes, index, parent);

    case NodeTypes.INTERPOLATION:
      return {
        node: transformInterpolation(node as ExtendedInterpolationNode),
      };

    case NodeTypes.TEXT:
      return { node: t.jsxText(node.content) };

    case NodeTypes.COMMENT:
      return { node: t.jsxText(`{/* ${node.content} */}`) };

    default:
      return null;
  }
}

/**
 * 转换元素节点
 */
function transformElementNode(
  elementNode: ExtendedElementNode,
  nodes: ExtendedNode[],
  index: number,
  parent?: ExtendedElementNode,
): TransformResult | null {
  // 跳过已处理的 v-if 链节点
  if (elementNode.vIfHandled) {
    return null;
  }

  // 处理 v-pre 指令
  if (elementNode.pre) {
    return { node: transformVPreElement(elementNode) };
  }

  // 处理内置组件
  if (elementNode.isBuiltIn) {
    return handleBuiltInComponent(elementNode);
  }

  // 处理条件渲染链
  const conditionalResult = handleConditionalChain(elementNode, nodes, index);
  if (!isNull(conditionalResult)) {
    return conditionalResult;
  }

  // 处理插槽模板
  const slotResult = handleSlotTemplate(elementNode, parent);
  if (!isNull(slotResult)) {
    return slotResult;
  }

  // 普通元素转换
  return { node: transformElement(elementNode) };
}

/**
 * 处理条件渲染链 (v-if / v-else-if / v-else)
 */
function handleConditionalChain(
  elementNode: ExtendedElementNode,
  nodes: ExtendedNode[],
  index: number,
): TransformResult | null {
  const conditionalDirective = elementNode.props.find(
    (prop) => prop.type === NodeTypes.DIRECTIVE && Conditionals.includes(prop.name),
  ) as ExtendedDirectiveNode | undefined;

  // 只有 v-if 指令才启动条件链处理
  if (conditionalDirective?.name !== VUE_DIR.if) {
    return null;
  }

  const { container, consumed } = buildConditionalChainExpression(nodes, index);

  return {
    node: t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier(Fragment), []),
      t.jsxClosingElement(t.jsxIdentifier(Fragment)),
      [container],
      false,
    ),
    skipCount: consumed, // 告诉调用者跳过的节点数
  };
}

/**
 * 处理插槽模板
 */
function handleSlotTemplate(
  elementNode: ExtendedElementNode,
  parent?: ExtendedElementNode,
): TransformResult | null {
  const isSlotTemplate =
    elementNode.tagType === ElementTypes.TEMPLATE &&
    elementNode.props.some(
      (prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === VUE_DIR.slot,
    );

  if (!isSlotTemplate || isUndefined(parent)) {
    return null;
  }

  transferSlotToParent(elementNode, parent);
  return { node: [] }; // 返回空数组，不添加到结果中
}

/**
 * 将插槽内容转移到父组件
 */
function transferSlotToParent(slotElement: ExtendedElementNode, parent: ExtendedElementNode): void {
  const jsxProps = transformProps(slotElement.props as ExtendedDirectiveNode[], slotElement);

  // 转移具名/作用域/动态插槽到父组件 props
  if (jsxProps.length) {
    parent.jsxProps = (parent.jsxProps ?? []).concat(jsxProps);
  }

  // 转移默认插槽到父组件 children
  if (!isUndefined(slotElement.jsxChildren)) {
    parent.jsxChildren = slotElement.jsxChildren;
  }
}

/**
 * 处理内置组件
 */
function handleBuiltInComponent(elementNode: ExtendedElementNode): TransformResult | null {
  const jsxComponent = transformBuildInElement(elementNode);
  // TODO: 待实现内置组件转换
  // return jsxComponent ? { node: jsxComponent } : null;
  return null;
}

/**
 * 构建条件链表达式
 */
function buildConditionalChainExpression(
  nodes: ExtendedNode[],
  startIdx: number,
): { container: t.JSXExpressionContainer; consumed: number } {
  const { expr, consumed } = buildConditionalExpressionFromArray(nodes, startIdx);
  return { container: t.jsxExpressionContainer(expr), consumed };
}
