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
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  resolveChildNodes(node, nodeIR, ctx, null, nodeIR.children);
}

export function resolveChildNodes(
  node: VueParentNode,
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  childrenIR: TemplateChildNodeIR[],
) {
  for (const child of node.children) {
    if (child.type === VueNodeTypes.ELEMENT) {
      if (isSlotOutlet(child)) {
        resolveSlotOutletNode(child, nodeIR, ctx, parentIR, childrenIR);
        continue;
      }

      if (isTemplateVSlotNode(child)) {
        if (parentIR) {
          resolveTemplateVSlotNode(child, nodeIR, ctx, parentIR);
        }
        continue;
      }

      const elementIR = resolveElementNode(child, nodeIR, ctx, childrenIR as ElementNodeIR[]);

      childrenIR.push(elementIR);

      if (child.children.length) {
        resolveChildNodes(child, nodeIR, ctx, elementIR, elementIR.children);
      }

      continue;
    }

    if (child.type === VueNodeTypes.INTERPOLATION) {
      resolveInterpolationNode(child, nodeIR, ctx, childrenIR);
      continue;
    }

    if (child.type === VueNodeTypes.TEXT) {
      resolveTextNode(child, nodeIR, ctx, childrenIR);
      continue;
    }

    if (child.type === VueNodeTypes.COMMENT) {
      resolveCommentNode(child, nodeIR, ctx, childrenIR);
    }
  }
}
