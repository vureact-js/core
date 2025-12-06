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
  isComponent: boolean;
  isSelfClosing?: boolean;
  ref?: string;
  meta: Partial<ElementNodeMeta>;
  /* 收集组件中定义的 slots emits props */
  defineProps: Record<string, any>;
  /* 使用 useMemo 缓存 */
  isMemo?: boolean;
}

export interface ElementNodeMeta extends RuntimeHelper {
  mapTraversal: {
    source: string;
    value: string;
    key?: string;
    index?: string;
    isDestructured: boolean;
    destructuringType?: 'object' | 'array';
  };
  /* 
    从v-memo得到的值是字符串数组 '[]'，
    但在生成阶段创建表达式会自动转成数组
  */
  memoDeps: string;
}

export function transformElement(node: VueElementNode): ElementNodeIR {
  const { tag, tagType, children, isSelfClosing } = node;

  const isComponent = tagType === ElementTypes.COMPONENT;

  const nodeIR = createElementNode({
    tag,
    isComponent,
    isSelfClosing,
  });

  transformProps(node, nodeIR);

  if (children.length) {
    transformChildren(children, nodeIR.children);
  }

  return nodeIR;
}

export function createElementNode(
  opts: Omit<
    ElementNodeIR,
    'type' | 'props' | 'children' | 'runtimeHelper' | 'meta' | 'defineProps'
  >,
): ElementNodeIR {
  return {
    type: NodeTypes.ELEMENT,
    ...opts,
    props: [],
    children: [],
    meta: {},
    defineProps: {},
  };
}
