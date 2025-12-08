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

export function transformTemplate(root?: VueRootNode): TemplateBlockIR | null {
  if (!root) return null;

  const chilren: TemplateChildNodeIR[] = [];

  transformChildren(root, chilren[0] as ElementNodeIR, chilren);

  return {
    chilren: wrapWithFragmentIR(chilren),
  };
}
