import { NodeTypes, TemplateChildNode } from '@vue/compiler-core';
import { ElementNodeIR, transformElement } from './element';
import { TextNodeIR } from './text';

export type TemplateChildNodeIR = ElementNodeIR | TextNodeIR

export function transformChildren(nodes: TemplateChildNode[], result: TemplateChildNodeIR[]) {
  for (const node of nodes) {
    if (node.type === NodeTypes.ELEMENT) {
      const nodeIR = transformElement(node);
      result.push(nodeIR);
    }
  }
}
