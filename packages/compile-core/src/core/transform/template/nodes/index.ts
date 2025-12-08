import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import {
  ElementTypes,
  SimpleExpressionNode,
  TemplateChildNode,
  NodeTypes as VueNodeTypes,
} from '@vue/compiler-core';
import { ElementNodeIR, transformElement } from './element';
import { createInterpolationNodeIR, InterpolationNodeIR } from './interpolation';
import { createTextNodeIR, TextNodeIR } from './text';

export type TemplateChildNodeIR = ElementNodeIR | TextNodeIR | InterpolationNodeIR;

export function transformChildren(nodes: TemplateChildNode[], result: TemplateChildNodeIR[]) {
  for (const node of nodes) {
    if (node.type === VueNodeTypes.ELEMENT) {
      const nodeIR = transformElement(node, result as ElementNodeIR[]);

      // 忽略 <template> 和 <slot> 元素
      if (node.tagType !== ElementTypes.TEMPLATE && node.tagType !== ElementTypes.SLOT) {
        result.push(nodeIR);
      }

      continue;
    }

    if (node.type === VueNodeTypes.INTERPOLATION) {
      const content = (node.content as SimpleExpressionNode).content;
      const isIdentifier = !strCodeTypes.isStringLiteral(content);

      result.push(createInterpolationNodeIR(content, isIdentifier));

      continue;
    }

    if (node.type === VueNodeTypes.TEXT) {
      result.push(createTextNodeIR(node.content));
      continue;
    }

    if (node.type === VueNodeTypes.COMMENT) {
      result.push(createTextNodeIR(node.content, true));
    }
  }
}
