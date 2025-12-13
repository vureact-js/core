import { parseFragmentExp } from '@shared/babel-utils';
import {
  SimpleExpressionNode,
  NodeTypes as VueNodeTypes,
  ParentNode as VueParentNode,
} from '@vue/compiler-core';
import { TemplateChildNodeIR } from '..';
import { createInterpolationNodeIR, createTextNodeIR } from '../shared/create-simple-node';
import { isSlotElement } from '../shared/is-slot-node';
import { ElementNodeIR, transformElement } from './node';

export function transformNodes(
  parent: VueParentNode,
  parentIR: ElementNodeIR,
  childrenIR: TemplateChildNodeIR[],
) {
  let nodeIR: TemplateChildNodeIR | null;

  for (const vueNode of parent.children) {
    if (vueNode.type === VueNodeTypes.ELEMENT) {
      nodeIR = transformElement(vueNode, parentIR, childrenIR as ElementNodeIR[]);
      // 忽略 <template #named> 和 <slot>
      if (nodeIR && !isSlotElement(vueNode)) {
        childrenIR.push(nodeIR);
      }

      continue;
    }

    if (vueNode.type === VueNodeTypes.INTERPOLATION) {
      const content = (vueNode.content as SimpleExpressionNode).content;

      nodeIR = createInterpolationNodeIR(content);
      nodeIR.babelExp = parseFragmentExp(nodeIR.content);

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
      nodeIR.babelExp = parseFragmentExp(nodeIR.content);

      childrenIR.push(nodeIR);
    }
  }
}
