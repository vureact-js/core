import { RuntimeHelper } from '@src/types/runtimeHepler';
import { ElementTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformChildren } from '.';
import { TemplateChildNodeIR } from '..';
import { PropsIR, transformProps } from '../props';
import { SlotPropsIR } from '../props/vslot';
import { isSlotElement } from '../shared/is-slot-node';
import { handleTemplateSlot } from './template-slot';
import { NodeTypes } from '../shared/node-types';


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

export interface ElementNodeIRMeta extends RuntimeHelper {
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

export function transformElement(
  node: VueElementNode,
  parentIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): ElementNodeIR | void {
  const { tag, tagType, children, isSelfClosing } = node;

  if (isSlotElement(node)) {
    handleTemplateSlot(node, parentIR);
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
    transformChildren(node, nodeIR, nodeIR.children);
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
