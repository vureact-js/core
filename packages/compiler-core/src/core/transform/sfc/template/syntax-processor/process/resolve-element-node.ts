import { ArrayExpression } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_COMPS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { BabelExp, NodeTypes } from '@src/core/transform/sfc/template/shared/types';
import { recordImport } from '@transform/shared';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { ElementTypes, SourceLocation, ElementNode as VueElementNode } from '@vue/compiler-core';
import { PropsIR, resolveProps, SlotPropsIR } from './props';

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
  loc?: SourceLocation;
}

export interface ElementNodeIRMeta {
  condition: ConditionMeta;
  loop: LoopMeta;
  memo: MemoMeta;
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

export function resolveElementNode(
  node: VueElementNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  siblingNodesIR: ElementNodeIR[],
): ElementNodeIR {
  const isComponent = resolveIsComponent(node);
  const tag = isComponent ? capitalize(camelCase(node.tag)) : node.tag;

  const nodeIR = createElementNodeIR({
    tag,
    isComponent,
    isSelfClosing: node.isSelfClosing,
    loc: node.loc,
  });

  resolveBuiltInComponentImport(nodeIR, ir, ctx);
  resolveProps(node, ir, ctx, nodeIR, siblingNodesIR);

  void parentIR;

  return nodeIR;
}

export function createElementNodeIR(options: BaseElementNodeIR): ElementNodeIR {
  return {
    type: NodeTypes.ELEMENT,
    ...options,
    props: [],
    children: [],
    meta: {},
    conditionIsHandled: false,
  };
}

function resolveIsComponent(node: VueElementNode): boolean {
  if (node.tagType !== ElementTypes.COMPONENT) {
    return camelCase(node.tag) !== node.tag;
  }

  return node.tagType === ElementTypes.COMPONENT;
}

function resolveBuiltInComponentImport(
  node: ElementNodeIR,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  if (node.tag in ADAPTER_COMPS) {
    node.isBuiltIn = true;
    recordImport(ctx, PACKAGE_NAME.runtime, node.tag);
  }
}
