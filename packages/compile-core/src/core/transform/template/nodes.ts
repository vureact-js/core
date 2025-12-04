import { NodeTypes, TemplateChildNode, ElementNode as VueElementNode } from '@vue/compiler-core';
import { PropsIR, transformProps } from './props';

export interface ElementNodeIR {
  tag: string;
  props: PropsIR;
  children: ElementNodeIR[];
}

export function transformChildren(nodes: TemplateChildNode[], result: ElementNodeIR[]) {
  for (const node of nodes) {
    if (node.type === NodeTypes.ELEMENT) {
      const elementNodeIR = transformElement(node);
      result.push(elementNodeIR);
    }
  }
}

export function transformElement(node: VueElementNode) {
  const nodeIR = createElementNode();

  nodeIR.tag = node.tag;
  nodeIR.props = transformProps(node);

  if (node.children.length) {
    transformChildren(node.children, nodeIR.children);
  }

  return nodeIR;
}

function createElementNode(): ElementNodeIR {
  return {
    tag: '',
    props: {
      attributes: [],
      directives: [],
      eventBindings: [],
      slots: [],
    },
    children: [],
  };
}
