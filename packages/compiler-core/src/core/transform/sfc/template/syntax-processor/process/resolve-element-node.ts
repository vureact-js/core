import { ArrayExpression } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
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
  isRoute?: boolean;
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
  siblingNodesIR: ElementNodeIR[],
): ElementNodeIR {
  const isComponent = getIsComponent(node);
  const tag = isComponent ? capitalize(camelCase(node.tag)) : node.tag;

  const nodeIR = createElementNodeIR({
    tag,
    isComponent,
    isSelfClosing: node.isSelfClosing,
    loc: node.loc,
  });

  // 查找 router 和 runtime-core 的适配器
  const routerAdapter = ADAPTER_RULES.router[tag];
  const runtimeAdapter = ADAPTER_RULES.runtime[tag];

  // 记录 Vue 内置组件
  if (runtimeAdapter) {
    nodeIR.isBuiltIn = true;
    recordImport(ctx, runtimeAdapter.package, runtimeAdapter.target);
  }

  // 记录 Vue Router 组件
  if (routerAdapter) {
    if (!ctx.route) ctx.route = true;
    nodeIR.isRoute = true;
    recordImport(ctx, routerAdapter?.package, routerAdapter.target);
  }

  resolveProps(node, ir, ctx, nodeIR, siblingNodesIR);

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

function getIsComponent(node: VueElementNode): boolean {
  if (node.tagType !== ElementTypes.COMPONENT) {
    return camelCase(node.tag) !== node.tag;
  }
  return node.tagType === ElementTypes.COMPONENT;
}
