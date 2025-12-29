import { RootNode as VueRootNode } from '@vue/compiler-core';
import { transformNodes } from './elements';
import { ElementNodeIR } from './elements/node';
import { BaseSimpleNodeIR, FragmentNodeIR } from './elements/node-creators';

export interface TemplateBlockIR {
  children: TemplateChildNodeIR[];
}

export type TemplateChildNodeIR = ElementNodeIR | BaseSimpleNodeIR | FragmentNodeIR;

export function transformRoot(root?: VueRootNode): TemplateBlockIR | null {
  if (!root) return null;

  const children: TemplateChildNodeIR[] = [];

  transformNodes(root, children[0] as ElementNodeIR, children);

  return {
    children,
  };
}
