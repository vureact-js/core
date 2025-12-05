import { RootNode } from '@vue/compiler-core';
import { transformChildren } from './nodes';
import { ElementNodeIR } from './nodes/element';

export interface TemplateBlockIR {
  chilren: ElementNodeIR[];
}

export function transformTemplate(root?: RootNode) {
  if (!root) return null;

  const block: TemplateBlockIR = {
    chilren: [],
  };

  transformChildren(root.children, block.chilren);

  return block;
}
