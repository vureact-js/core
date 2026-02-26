import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_COMPS, ADAPTER_ROUTER_COMPS } from '@consts/adapters-map';
import { TemplateBlockIR, TemplateChildNodeIR } from '@transform/sfc/template';
import { NodeTypes } from '@transform/sfc/template/shared/types';
import { RootNode as VueRootNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../process';
import { resolveRouterLinkRules } from './resolve-router-link-rules';
import { resolveTransitionRules } from './resolve-transition-rules';

export function resolveComponentRules(
  _node: VueRootNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  resolveElementChildrenRules(ir.children, ctx, null, ir);
}

function resolveElementChildrenRules(
  children: TemplateChildNodeIR[],
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  ir: TemplateBlockIR,
) {
  for (const child of children) {
    if (child.type !== NodeTypes.ELEMENT) {
      continue;
    }

    const nodeIR = child as ElementNodeIR;

    if (parentIR?.isBuiltIn) {
      // 校验 Transition 子节点
      if (parentIR.tag == ADAPTER_COMPS.Transition) {
        resolveTransitionRules(nodeIR, parentIR, ir, ctx);
      }
    }

    if (nodeIR.isRoute) {
      if (nodeIR.tag === ADAPTER_ROUTER_COMPS.RouterLink) {
        resolveRouterLinkRules(nodeIR, ctx);
      }
    }

    resolveElementChildrenRules(nodeIR.children, ctx, nodeIR, ir);
  }
}
