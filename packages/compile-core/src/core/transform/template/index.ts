import { RootNode as VueRootNode } from '@vue/compiler-core';
import { transformChildren } from './nodes';
import { ElementNodeIR } from './nodes/element';
import { FragmentNodeIR, wrapWithFragmentIR } from './nodes/fragment';
import { InterpolationNodeIR } from './nodes/interpolation';
import { TextNodeIR } from './nodes/text';

export interface TemplateBlockIR {
  children: TemplateChildNodeIR[];
}

export type TemplateChildNodeIR = ElementNodeIR | TextNodeIR | InterpolationNodeIR | FragmentNodeIR;

export function transformTemplate(root?: VueRootNode): TemplateBlockIR | null {
  if (!root) return null;

  const children: TemplateChildNodeIR[] = [];

  transformChildren(root, children[0] as ElementNodeIR, children);

  return {
    children: wrapWithFragmentIR(children),
  };
}
