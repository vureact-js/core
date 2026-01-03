import { ArrayExpression } from '@babel/types';
import { ElementTypes, ElementNode as VueElementNode } from '@vue/compiler-core';
import { transformElements } from '.';
import { TemplateChildNodeIR } from '..';
import { PropsIR, transformProps } from '../props';
import { SlotPropsIR } from '../props/vslot';
import { BabelExp, NodeTypes } from '../shared/types';
import { handleBuiltinComponent, markBuiltinComponent } from './built-in-components';

export interface ElementNodeIR extends BaseElementNodeIR {
  type: NodeTypes;
  props: (PropsIR | SlotPropsIR)[];
  children: TemplateChildNodeIR[];
  meta: Partial<ElementNodeIRMeta>;
  conditionIsHandled: boolean;
  isBuiltIn?: boolean;
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
  // v-show
  show: ShowMeta;
}

export type ConditionMeta = {
  if?: boolean;
  elseIf?: boolean;
  else?: boolean;
  value: string;
  babelExp: BabelExp;
  next?: ElementNodeIR;
  isHandled: boolean;
};

export type LoopMeta = {
  isLoop?: boolean;
  value: {
    source: string;
    value: string;
    key?: string;
    index?: string;
  };
  isHandled: boolean;
};

export type MemoMeta = {
  isMemo?: boolean;
  value: string;
  babelExp: BabelExp<ArrayExpression>;
  isHandled: boolean;
};

export type ShowMeta = {
  isShow?: boolean;
  value: string;
  babelExp: BabelExp;
};

export function transformElement(
  node: VueElementNode,
  parentIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): ElementNodeIR {
  const { tag, tagType, children, isSelfClosing } = node;
  const isComponent = tagType === ElementTypes.COMPONENT;

  const nodeIR = createElementNode({
    tag,
    isComponent,
    isSelfClosing,
  });

  markBuiltinComponent(nodeIR);
  transformProps(node, nodeIR, nodesIR);
  handleBuiltinComponent(nodeIR, parentIR, node.loc);

  if (children.length) {
    transformElements(node, nodeIR, nodeIR.children);
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
    conditionIsHandled: false,
  };
}
