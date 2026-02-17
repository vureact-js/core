import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { isTemplateVSlotNode } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import {
  isSlotOutlet,
  NodeTypes as VueNodeTypes,
  ParentNode as VueParentNode,
  RootNode as VueRootNode,
} from '@vue/compiler-core';
import { resolveCommentNode } from './resolve-comment-node';
import { ElementNodeIR, resolveElementNode } from './resolve-element-node';
import { resolveInterpolationNode } from './resolve-interpolation-node';
import { resolveSlotOutletNode } from './resolve-slot-outlet-node';
import { resolveTemplateVSlotNode } from './resolve-template-v-slot-node';
import { resolveTextNode } from './resolve-text-node';

export function resolveTemplateChildren(
  node: VueRootNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  resolveChildNodes(node, ir, ctx, null, ir.children);
}

export function resolveChildNodes(
  node: VueParentNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  childrenIR: TemplateChildNodeIR[],
) {
  for (const childNode of node.children) {
    if (childNode.type === VueNodeTypes.ELEMENT) {
      if (isSlotOutlet(childNode)) {
        resolveSlotOutletNode(childNode, ir, ctx, parentIR, childrenIR);
        continue;
      }

      if (isTemplateVSlotNode(childNode)) {
        if (parentIR) {
          resolveTemplateVSlotNode(childNode, ir, ctx, parentIR);
        }
        continue;
      }

      const elementIR = resolveElementNode(
        childNode,
        ir,
        ctx,
        parentIR,
        childrenIR as ElementNodeIR[],
      );

      childrenIR.push(elementIR);

      if (childNode.children.length) {
        resolveChildNodes(childNode, ir, ctx, elementIR, elementIR.children);
      }

      continue;
    }

    if (childNode.type === VueNodeTypes.INTERPOLATION) {
      resolveInterpolationNode(childNode, ir, ctx, childrenIR);
      continue;
    }

    if (childNode.type === VueNodeTypes.TEXT) {
      resolveTextNode(childNode, ir, ctx, childrenIR);
      continue;
    }

    if (childNode.type === VueNodeTypes.COMMENT) {
      resolveCommentNode(childNode, ir, ctx, childrenIR);
    }
  }
}
