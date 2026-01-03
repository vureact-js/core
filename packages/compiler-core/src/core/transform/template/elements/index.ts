import {
  isSlotOutlet,
  SimpleExpressionNode,
  NodeTypes as VueNodeTypes,
  ParentNode as VueParentNode,
} from '@vue/compiler-core';
import { TemplateChildNodeIR } from '..';
import { resolveTemplateExp } from '../shared/resolve-str-exp';
import { isVSlot } from '../shared/utils';
import { ElementNodeIR, transformElement } from './element';
import { createInterpolationNodeIR, createTextNodeIR } from './node-creators';
import { transformSlot } from './slot';
import { transformVSlotNode } from './template-vslot';

export function transformElements(
  parent: VueParentNode,
  parentIR: ElementNodeIR,
  childrenIR: TemplateChildNodeIR[],
) {
  let nodeIR: TemplateChildNodeIR | null;

  for (const vueNode of parent.children) {
    if (vueNode.type === VueNodeTypes.ELEMENT) {
      if (isSlotOutlet(vueNode)) {
        transformSlot(vueNode, parentIR);
        continue;
      }

      if (isVSlot(vueNode)) {
        transformVSlotNode(vueNode, parentIR);
        continue;
      }

      nodeIR = transformElement(vueNode, parentIR, childrenIR as ElementNodeIR[]);

      childrenIR.push(nodeIR);

      continue;
    }

    if (vueNode.type === VueNodeTypes.INTERPOLATION) {
      const content = (vueNode.content as SimpleExpressionNode).content;

      nodeIR = createInterpolationNodeIR(content);
      nodeIR.babelExp = resolveTemplateExp(nodeIR.content);

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
      nodeIR.babelExp = resolveTemplateExp(nodeIR.content);

      childrenIR.push(nodeIR);
    }
  }
}
