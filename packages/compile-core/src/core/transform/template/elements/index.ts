import { strCodeTypes } from '@src/shared/string-code-types';
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
      const isIdentifier = !strCodeTypes.isStringLiteral(content);

      childrenIR.push(createInterpolationNodeIR(content, isIdentifier));

      continue;
    }

    if (node.type === VueNodeTypes.TEXT) {
      childrenIR.push(createTextNodeIR(node.content));
      continue;
    }

    if (node.type === VueNodeTypes.COMMENT) {
      childrenIR.push(createTextNodeIR(node.content, true));
    }
  }
}
