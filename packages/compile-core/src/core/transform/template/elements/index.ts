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
  for (const node of parent.children) {
    if (node.type === VueNodeTypes.ELEMENT) {
      const nodeIR = transformElement(node, parentIR, childrenIR as ElementNodeIR[]);
      // 忽略 <template #named> 和 <slot>
      if (nodeIR && !isSlotElement(node)) {
        childrenIR.push(nodeIR);
      }

      continue;
    }

    if (node.type === VueNodeTypes.INTERPOLATION) {
      const content = (node.content as SimpleExpressionNode).content;
      const nodeIR = createInterpolationNodeIR(content);
      preParseInterp(nodeIR, content);
      childrenIR.push(nodeIR);

      continue;
    }

    if (node.type === VueNodeTypes.TEXT) {
      childrenIR.push(createTextNodeIR(node.content));
      continue;
    }

    if (node.type === VueNodeTypes.COMMENT) {
      const { content } = node;
      const nodeIR = createTextNodeIR(content, true);
      preParseComment(nodeIR);
      childrenIR.push(nodeIR);
    }
  }
}
