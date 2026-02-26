import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_ROUTER_COMPS } from '@consts/adapters-map';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  isVBind,
  isVConditional,
  isVModel,
  isVOn,
  isVSlot,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import {
  warnUnsupportedDirective,
  warnUnsupportedVueDollarVar,
} from '@src/core/transform/sfc/template/shared/warning-utils';
import { DirectiveNode, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { resolveDynamicAttributeProp } from './resolve-dynamic-attribute-prop';
import { resolveRouterLinkVSlotProp } from './resolve-router-link-v-slot-prop';
import { resolveVFor } from './resolve-v-for';
import { resolveVHtml } from './resolve-v-html';
import { resolveVIf } from './resolve-v-if';
import { resolveVMemo } from './resolve-v-memo';
import { resolveVModel } from './resolve-v-model';
import { resolveVOn } from './resolve-v-on';
import { resolveVShow } from './resolve-v-show';
import { resolveVText } from './resolve-v-text';

const SUPPORTED_DIRECTIVES = new Set<string>([
  'text',
  'html',
  'show',
  'if',
  'else',
  'else-if',
  'for',
  'on',
  'once',
  'bind',
  'model',
  'cloak',
  'slot',
  'memo',
  'is',
]);

export function resolveDirectiveProp(
  node: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  elementNode: VueElementNode,
  nodeIR: ElementNodeIR,
  siblingNodesIR: ElementNodeIR[],
): boolean | void {
  const { name, rawName } = node;

  if (!SUPPORTED_DIRECTIVES.has(name)) {
    warnUnsupportedDirective(ctx, node.loc, rawName);
    return;
  }

  warnUnsupportedVueDollarVar(ctx, node);

  if (isVConditional(rawName)) {
    return resolveVIf(node, ir, ctx, nodeIR, siblingNodesIR);
  }

  /**
   * 处理能够直接精确匹配的指令
   */
  function processExactDirectives() {
    switch (node.rawName) {
      case 'v-html':
        resolveVHtml(node, ir, ctx, nodeIR);
        return true;
      case 'v-text':
        resolveVText(node, ir, ctx, nodeIR);
        return true;
      case 'v-once':
      case 'v-memo':
        return resolveVMemo(node, ir, ctx, nodeIR);
      case 'v-show':
        return resolveVShow(node, ir, ctx, nodeIR);
      case 'v-for':
        return resolveVFor(node, ir, ctx, nodeIR);
    }
  }

  /**
   * 处理模糊匹配的指令，如 v-on/@/:
   */
  function processRangeDirectives(): true | void {
    const { rawName } = node;

    if (isVModel(rawName)) {
      return resolveVModel(node, ir, ctx, elementNode, nodeIR);
    }
    if (isVBind(rawName)) {
      return resolveDynamicAttributeProp(node, ir, ctx, nodeIR);
    }
    if (isVOn(rawName)) {
      return resolveVOn(node, ir, ctx, nodeIR);
    }
    if (isVSlot(rawName)) {
      if (nodeIR.tag === ADAPTER_ROUTER_COMPS.RouterLink) {
        resolveRouterLinkVSlotProp(node, nodeIR,ctx);
      }
      return true;
    }
  }

  return processExactDirectives() || processRangeDirectives();
}
