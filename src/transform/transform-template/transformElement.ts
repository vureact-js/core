import * as t from '@babel/types';
import { VUE_BUILT_IN_COMPS } from '@constants/vue';
import { Fragment } from '@transform/constants';
import { logger } from '@transform/utils/logger';
import { isUndefined } from '@utils/types';
import {
  ElementTypes,
  NodeTypes,
  type AttributeNode,
  type SimpleExpressionNode,
} from '@vue/compiler-core';
import { Structural } from './constants';
import { transformChildren } from './transformChildren';
import { mergeProps, transformProps, transformStaticAttributes } from './transformProps';
import type {
  ExtendedDirectiveNode,
  ExtendedElementNode,
  ExtendedNode,
  ExtendJSXNode,
} from './types';

export function transformElement(
  node: ExtendedElementNode,
  customProps?: ExtendedDirectiveNode[],
): ExtendJSXNode {
  if (node.pre) {
    return transformVPreElement(node);
  }

  const props = transformProps(customProps ?? (node.props as ExtendedDirectiveNode[]), node);

  // Return if jsxElement set (v-if/v-once/v-memo)
  if (!isUndefined(node.jsxElement)) {
    return node.jsxElement;
  }

  const children = node.jsxChildren
    ? Array.isArray(node.jsxChildren)
      ? node.jsxChildren
      : [node.jsxChildren]
    : transformChildren(node.children as ExtendedNode[], node);

  // If template node: don't generate <template> DOM, inline children (or Fragment)
  if (node.tagType === ElementTypes.TEMPLATE) {
    return t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier(Fragment), []),
      t.jsxClosingElement(t.jsxIdentifier(Fragment)),
      children,
      false,
    );
  }

  const tag = t.jsxIdentifier(node.tag);
  const selfClosing = !children.length;

  return t.jsxElement(
    t.jsxOpeningElement(tag, mergeProps(props, node.jsxProps), selfClosing),
    selfClosing ? null : t.jsxClosingElement(tag),
    children,
    selfClosing,
  );
}

export function transformElementWithoutConditionals(
  node: ExtendedElementNode,
  props: (ExtendedDirectiveNode | AttributeNode)[],
): t.JSXElement {
  // Check if node is already vIfHandled
  if (node.vIfHandled) {
    return t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier(Fragment), []),
      t.jsxClosingElement(t.jsxIdentifier(Fragment)),
      [],
      false,
    );
  }

  // Filter conditional/Structural directives and transform props
  const filterProps = props.filter(
    (prop) => !(prop.type === NodeTypes.DIRECTIVE && Structural.includes(prop.name)),
  ) as ExtendedDirectiveNode[];

  const jsxElem = transformElement(node, filterProps);
  node.vIfHandled = true;

  return jsxElem as t.JSXElement;
}

/**
 * 处理 v-pre 元素的转换
 * v-pre 会跳过该元素及其所有子元素的编译过程
 * 在 React 中转换为静态 JSX 内容
 */
export function transformVPreElement(node: ExtendedElementNode): t.JSXElement {
  const staticProps = transformStaticAttributes(node.props as ExtendedDirectiveNode[]);

  const staticChildren = node.children
    .map((child) => {
      if (child.type === NodeTypes.ELEMENT) {
        // 递归处理子元素（保持 v-pre 行为）
        return transformVPreElement(child);
      } else if (child.type === NodeTypes.INTERPOLATION) {
        // 保持原始插值语法
        const content = (child.content as SimpleExpressionNode)?.content || '';
        return t.jsxText(`{{ ${content} }}`);
      } else if (child.type === NodeTypes.TEXT) {
        return t.jsxText(child.content);
      } else if (child.type === NodeTypes.COMMENT) {
        return t.jsxText(`{/* ${child.content} */}`);
      }
      return t.jsxText('');
    })
    .filter(Boolean) as ExtendJSXNode[];

  const selfClosing = staticChildren.length === 0;

  return t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier(node.tag), staticProps, selfClosing),
    selfClosing ? null : t.jsxClosingElement(t.jsxIdentifier(node.tag)),
    staticChildren,
    selfClosing,
  );
}

/**
 * transform vue build-in components
 */
export function transformBuildInElement(node: ExtendedElementNode): t.JSXElement {
  const handleSuspense = () => {
    // todo
  };

  const handleComponent = () => {
    // 1.字符串属性，直接取值作为创建jsx元素的tagName
    // 2.动态变量（vue可以直接使用变量名作为组件，不区分大小写，而react则要考虑很多了，如果不是首字母大写的，那就成了普通html元素，如果强行将其双驼峰化，那又对不上原来的变量名了）
    //   2.1 属于import进来的模块名
    //   2.2 属于表达式变量名，例如 const comp = ComponentA 的comp
    // 3.表达式
    //  3.1 三元表达式，例如 cond1 ? CompA : CompB，甚至更复杂的三元表达式
    //  3.2 函数，例如 getComp() / getComp.A() / etc.
    // 看似简单的component组件，处理起来衍生出了许多情况分支
  };

  const handleTeleport = () => {};

  // Using the third-party package "react-activation"
  const handleKeepAlive = () => {};

  const handleTransition = () => {};

  const handleTransitionGroup = () => {};

  switch (node.tag) {
    case VUE_BUILT_IN_COMPS.Suspense:
      return handleSuspense();

    case VUE_BUILT_IN_COMPS.Component:
      return handleComponent();

    case VUE_BUILT_IN_COMPS.Teleport:
      return handleTeleport();

    case VUE_BUILT_IN_COMPS.KeepAlive:
      return handleKeepAlive();

    case VUE_BUILT_IN_COMPS.Transition:
      return handleTransition();

    case VUE_BUILT_IN_COMPS.TransitionGroup:
      return handleTransitionGroup();

    default: {
      logger.warn(node, `Unsupported Vue built-in component '${node.tag}'`);
      break;
    }
  }
}
