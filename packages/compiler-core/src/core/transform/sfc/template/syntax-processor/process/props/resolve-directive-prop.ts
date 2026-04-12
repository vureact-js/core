import { ICompilationContext } from '@compiler/context/types';
import { SUPPORTED_DIRECTIVES } from '@consts/other';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { TemplateBlockIR } from '@transform/sfc/template';
import {
  isVBind,
  isVConditional,
  isVModel,
  isVOn,
  isVSlot,
} from '@transform/sfc/template/shared/prop-ir-utils';
import {
  warnUnsupportedDirective,
  warnUnsupportedVueDollarVar,
} from '@transform/sfc/template/shared/warning-utils';
import { DirectiveNode, ElementNode as VueElementNode } from '@vue/compiler-core';
import {
  resolveDynamicAttributeProp,
  resolveRouterLinkVSlotProp,
  resolveVFor,
  resolveVHtml,
  resolveVIf,
  resolveVMemo,
  resolveVModel,
  resolveVOn,
  resolveVShow,
  resolveVText,
} from '.';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveDirectiveProp(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  vueNode: VueElementNode,
  nodeIR: ElementNodeIR,
  siblingNodesIR: ElementNodeIR[],
): boolean | void {
  const { name, rawName } = directive;

  if (!SUPPORTED_DIRECTIVES.has(name)) {
    warnUnsupportedDirective(ctx, directive.loc, rawName);
    return;
  }

  warnUnsupportedVueDollarVar(ctx, directive);

  if (isVConditional(rawName)) {
    return resolveVIf(directive, ir, ctx, nodeIR, siblingNodesIR);
  }

  /**
   * 处理能够直接精确匹配的指令
   */
  function processExactDirectives() {
    switch (directive.rawName) {
      case 'v-html':
        resolveVHtml(directive, ir, ctx, nodeIR);
        return true;

      case 'v-text':
        resolveVText(directive, ir, ctx, nodeIR);
        return true;

      case 'v-once':
      case 'v-memo':
        return resolveVMemo(directive, ir, ctx, nodeIR);

      case 'v-show':
        return resolveVShow(directive, ir, ctx, nodeIR);

      case 'v-for':
        return resolveVFor(directive, ir, ctx, nodeIR);
    }
  }

  /**
   * 处理模糊匹配的指令，如 v-on/@/:
   */
  function processRangeDirectives(): true | void {
    const { rawName } = directive;

    if (isVModel(rawName)) {
      return resolveVModel(directive, ir, ctx, vueNode, nodeIR);
    }

    if (isVBind(rawName)) {
      return resolveDynamicAttributeProp(directive, ir, ctx, vueNode, nodeIR);
    }

    if (isVOn(rawName)) {
      return resolveVOn(directive, ir, ctx, nodeIR);
    }

    if (isVSlot(rawName)) {
      if (nodeIR.tag === VUE_API_MAP.RouterLink) {
        resolveRouterLinkVSlotProp(directive, nodeIR, ctx);
      }
      return true;
    }
  }

  return processExactDirectives() || processRangeDirectives();
}
