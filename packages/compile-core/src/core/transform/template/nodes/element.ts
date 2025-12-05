import { RuntimeHelper } from '@core/transform/types';
import { ElementTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { TemplateChildNodeIR, transformChildren } from '.';
import { PropsIR, transformProps } from '../props';
import { NodeTypes } from './types';

export interface ElementNodeIR extends RuntimeHelper {
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
}

export interface ElementNodeMeta {
  mapTraversal: {
    source: string;
    value: string;
    key?: string;
    index?: string;
    isDestructured: boolean;
    destructuringType?: 'object' | 'array';
  };
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
    runtimeHelper: {} as RuntimeHelper['runtimeHelper'],
  };
}
