import { RuntimeHelper } from '@src/types/runtimeHepler';
import { ElementTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { TemplateChildNodeIR, transformChildren } from '.';
import { PropsIR, transformProps } from '../props';
import { NodeTypes } from './types';

export interface ElementNodeIR {
  type: NodeTypes;
  tag: string;
  props: PropsIR[];
  children: TemplateChildNodeIR[];
  isSelfClosing?: boolean;
  ref?: string;
  meta: Partial<ElementNodeMeta>;
  /* 收集组件中定义的 slots emits props */
  defineProps: Record<string, any>;
}

export interface ElementNodeMeta extends RuntimeHelper {
  /* 
   字段 value 是 string 的原因，
   是因为从 vue 解析得到的值都是字符串类型，
   但在生成阶段创建表达式会自动转成对应类型。
  */

  // v-if/v-else-if/v-else
  conditionalBranch: {
    if?: boolean;
    elseIf?: boolean;
    else?: boolean;
    value: string;
  };

  // v-for
  loop: {
    isLoop?: boolean;
    value: {
      source: string;
      value: string;
      key?: string;
      index?: string;
      isDestructured: boolean;
      destructuringType?: 'object' | 'array';
    };
  };

  // v-memo/v-once
  memo: {
    isMemo?: boolean;
    value: string;
  };
}

export function transformElement(node: VueElementNode, nodesIR: ElementNodeIR[]): ElementNodeIR {
  const { tag, tagType, children, isSelfClosing } = node;

  const nodeIR = createElementNode({
    type: getDefaultNodeType(tagType),
    tag,
    isSelfClosing,
  });

  transformProps(node, nodeIR, nodesIR);

  if (children.length) {
    transformChildren(children, nodeIR.children);
  }

  return nodeIR;
}

export function createElementNode(
  opts: Omit<ElementNodeIR, 'props' | 'children' | 'runtimeHelper' | 'meta' | 'defineProps'>,
): ElementNodeIR {
  return {
    ...opts,
    props: [],
    children: [],
    meta: {},
    defineProps: {},
  };
}

function getDefaultNodeType(tagType: ElementTypes): NodeTypes {
  return tagType === ElementTypes.COMPONENT ? NodeTypes.COMPONENT : NodeTypes.ELEMENT;
}
