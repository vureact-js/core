import { strCodeTypes } from '@src/shared/getStrCodeBabelType';
import {
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
      
      result.push(nodeIR);

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
