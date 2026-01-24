import { ArrayExpression } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import {
  AttributeNode,
  ElementTypes,
  ElementNode as VueElementNode,
  NodeTypes as VueNodeTypes,
} from '@vue/compiler-core';
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
  ctx: ICompilationContext,
  node: VueElementNode,
  parentIR: ElementNodeIR,
  nodesIR: ElementNodeIR[],
): ElementNodeIR {
  const { tag, children, isSelfClosing } = node;

  const isComponent = getIsCompType(node);
  const newTag = isComponent ? capitalize(camelCase(tag)) : tag;

  const nodeIR = createElementNode({
    tag: newTag,
    isComponent,
    isSelfClosing,
  });

  if (!isComponent) {
    injectStyleScopeId(ctx, node);
  }

  markBuiltinComponent(ctx, nodeIR);

  transformProps(ctx, node, nodeIR, nodesIR);

  handleBuiltinComponent(ctx, nodeIR, parentIR, node.loc);

  if (children.length) {
    transformElements(ctx, node, nodeIR, nodeIR.children);
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

function getIsCompType(node: VueElementNode): boolean {
  const { tag, tagType } = node;
  if (tagType !== ElementTypes.COMPONENT) {
    return camelCase(tag) !== tag;
  }
  return tagType === ElementTypes.COMPONENT;
}

function injectStyleScopeId(ctx: ICompilationContext, node: VueElementNode) {
  const { styleData } = ctx;

  const isIgnore = node.props.some((p) => {
    if (p.type === VueNodeTypes.DIRECTIVE && p.arg?.type === VueNodeTypes.SIMPLE_EXPRESSION) {
      return p.arg.content === 'is';
    }
  });

  if (isIgnore || !styleData.scopeId) return;

  const attr: AttributeNode = {
    type: VueNodeTypes.ATTRIBUTE,
    name: styleData.scopeId, // [data-css-xxxxxxx]
    value: undefined,
    loc: node.loc,
    nameLoc: { ...node.loc, source: styleData.scopeId },
  };

  node.props.push(attr);
}
