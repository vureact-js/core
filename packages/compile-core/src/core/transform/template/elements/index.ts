import {
  SimpleExpressionNode,
  NodeTypes as VueNodeTypes,
  ParentNode as VueParentNode,
} from '@vue/compiler-core';
import { TemplateChildNodeIR } from '..';
import { createInterpolationNodeIR, createTextNodeIR } from '../shared/create-simple-node';
import { isSlotElement } from '../shared/is-slot-node';
import { preParseComment, preParseInterp } from '../shared/pre-parse/node';
import { ElementNodeIR, transformElement } from './node';

export function transformNodes(
  parent: VueParentNode,
  parentIR: ElementNodeIR,
  childrenIR: TemplateChildNodeIR[],
) {
  for (const vueNode of parent.children) {
    if (vueNode.type === VueNodeTypes.ELEMENT) {
      const nodeIR = transformElement(vueNode, parentIR, childrenIR as ElementNodeIR[]);
      // 忽略 <template #named> 和 <slot>
      if (nodeIR && !isSlotElement(vueNode)) {
        childrenIR.push(nodeIR);
      }

      continue;
    }

    if (vueNode.type === VueNodeTypes.INTERPOLATION) {
      const content = (vueNode.content as SimpleExpressionNode).content;
      const nodeIR = createInterpolationNodeIR(content);
      preParseInterp(nodeIR, content);
      childrenIR.push(nodeIR);

      continue;
    }

    if (vueNode.type === VueNodeTypes.TEXT) {
      childrenIR.push(createTextNodeIR(vueNode.content));
      continue;
    }

    if (vueNode.type === VueNodeTypes.COMMENT) {
      const { content } = vueNode;
      const nodeIR = createTextNodeIR(content, true);
      preParseComment(nodeIR);
      childrenIR.push(nodeIR);
    }
  }
}
