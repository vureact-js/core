import { TemplateChildNodeIR } from '..';
import { NodeTypes } from './types';

export interface FragmentNodeIR {
  type: NodeTypes;
  children: TemplateChildNodeIR[];
}

export function wrapWithFragmentIR(children: TemplateChildNodeIR[]): TemplateChildNodeIR[] {
  return children.length > 1 ? [createFragmentIR(children)] : children;
}

export function createFragmentIR(children: TemplateChildNodeIR[]): FragmentNodeIR {
  return {
    type: NodeTypes.FRAGMENT,
    children,
  };
}
