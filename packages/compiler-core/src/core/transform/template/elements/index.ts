import { ICompilationContext } from '@compiler/context/types';
import {
  isSlotOutlet,
  SimpleExpressionNode,
  NodeTypes as VueNodeTypes,
  ParentNode as VueParentNode,
} from '@vue/compiler-core';
import { TemplateChildNodeIR } from '..';
import { resolveTemplateExp } from '../shared/resolve-str-exp';
import { warnVueDollarVar } from '../shared/unsupported-warn';
import { isVSlot } from '../shared/utils';
import { ElementNodeIR, transformElement } from './element';
import { createInterpolationNodeIR, createTextNodeIR } from './node-creators';
import { transformSlot } from './slot';
import { transformVSlotNode } from './template-vslot';

export function transformElements(
  ctx: ICompilationContext,
  parent: VueParentNode,
  parentIR: ElementNodeIR,
  childrenIR: TemplateChildNodeIR[],
) {
  let nodeIR: TemplateChildNodeIR | null;

  for (const vueNode of parent.children) {
    if (vueNode.type === VueNodeTypes.ELEMENT) {
      if (isSlotOutlet(vueNode)) {
        transformSlot(ctx, vueNode, parentIR);
        continue;
      }

      if (isVSlot(vueNode)) {
        transformVSlotNode(ctx, vueNode, parentIR);
        continue;
      }

      nodeIR = transformElement(ctx, vueNode, parentIR, childrenIR as ElementNodeIR[]);

      childrenIR.push(nodeIR);

      continue;
    }

    if (vueNode.type === VueNodeTypes.INTERPOLATION) {
      const content = (vueNode.content as SimpleExpressionNode).content;

      warnVueDollarVar(ctx, vueNode);

      nodeIR = createInterpolationNodeIR(content);
      nodeIR.babelExp = resolveTemplateExp(ctx, nodeIR.content);

      childrenIR.push(nodeIR);

      continue;
    }

    if (vueNode.type === VueNodeTypes.TEXT) {
      childrenIR.push(createTextNodeIR(vueNode.content));
      continue;
    }

    if (vueNode.type === VueNodeTypes.COMMENT) {
      const { content } = vueNode;

      nodeIR = createTextNodeIR(content, true);
      nodeIR.babelExp = resolveTemplateExp(ctx, nodeIR.content);

      childrenIR.push(nodeIR);
    }
  }
}
