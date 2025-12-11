import { Expression } from '@babel/types';
import { ElementTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformNodes } from '.';
import { TemplateChildNodeIR } from '..';
import { PropsIR, transformProps } from '../props';
import { SlotPropsIR } from '../props/vslot';
import { isSlotElement } from '../shared/is-slot-node';
import { NodeTypes } from '../shared/types';
import { transformVSlot } from './slot';

export interface ElementNodeIR extends BaseElementNodeIR {
  type: NodeTypes;
  props: (PropsIR | SlotPropsIR)[];
  children: TemplateChildNodeIR[];
  meta: Partial<ElementNodeIRMeta>;
  /* 收集组件中定义的 slots emits props */
  defineProps: Record<string, any>;
}

export interface BaseElementNodeIR {
  tag: string;
  isComponent?: boolean;
  isSelfClosing?: boolean;
  ref?: string;
}

export interface ElementNodeIRMeta {
  // v-if/v-else-if/v-else
  condition: ConditionMeta;
  // v-for
  loop: LoopMeta;
  // v-memo/v-once
  memo: MemoMeta;
}

export type ConditionMeta = {
  if?: boolean;
  elseIf?: boolean;
  else?: boolean;
  value: string;
  babelExp: Expression;
};

export type LoopMeta = {
  isLoop?: boolean;
  value: {
    source: string;
    value: string;
    key?: string;
    index?: string;
  };
};

export type MemoMeta = {
  isMemo?: boolean;
  value: string;
  babelExp: Expression;
};

export function transformElement(
  node: VueElementNode,
  parentIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): ElementNodeIR | void {
  const { tag, tagType, children, isSelfClosing } = node;

  if (isSlotElement(node)) {
    transformVSlot(node, parentIR);
    return;
  }

  const isComponent = tagType === ElementTypes.COMPONENT;

  const nodeIR = createElementNode({
    tag,
    isComponent,
    isSelfClosing,
  });

  transformProps(node, nodeIR, nodesIR);

  if (children.length) {
    transformNodes(node, nodeIR, nodeIR.children);
  }

  return nodeIR;
}

export function createElementNode(opts: BaseElementNodeIR): ElementNodeIR {
  return {
    type: NodeTypes.ELEMENT,
    ...opts,
    props: [],
    children: [],
    meta: {},
    defineProps: {},
  };
}
