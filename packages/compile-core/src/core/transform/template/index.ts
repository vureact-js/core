import { RootNode as VueRootNode } from '@vue/compiler-core';
import { transformChildren } from './nodes';
import { ElementNodeIR } from './nodes/element';
import { FragmentNodeIR, wrapWithFragmentIR } from './nodes/fragment';
import { InterpolationNodeIR } from './nodes/interpolation';
import { TextNodeIR } from './nodes/text';

export interface TemplateBlockIR {
  chilren: TemplateChildNodeIR[];
}

export type TemplateChildNodeIR = ElementNodeIR | TextNodeIR | InterpolationNodeIR | FragmentNodeIR;

export function transformTemplate(root?: VueRootNode) {
  if (!root) return null;

  const block: TemplateBlockIR = {
    chilren: [],
  };

  transformChildren(root, block.chilren[0] as ElementNodeIR, block.chilren);

  if (block.chilren.length > 1) {
    block.chilren = wrapWithFragmentIR(block.chilren);
  }

  return block;
}
