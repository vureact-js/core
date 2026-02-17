import { Expression } from '@babel/types';
import { TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { isVSlot as isCompilerVSlot, ElementNode as VueElementNode } from '@vue/compiler-core';
import { NodeTypes } from './types';

export interface BaseSimpleNodeIR {
  type: NodeTypes;
  content: string;
  babelExp: Expression;
}

export interface FragmentNodeIR {
  type: NodeTypes;
  children: TemplateChildNodeIR[];
}

export function createInterpolationNodeIR(content: string): BaseSimpleNodeIR {
  return {
    type: NodeTypes.JSX_INTERPOLATION,
    content,
    babelExp: {} as Expression,
  };
}

export function createTextNodeIR(content: string, isComment = false): BaseSimpleNodeIR {
  const normalizedContent = !isComment ? content : `/*${content}*/`;

  return {
    type: !isComment ? NodeTypes.TEXT : NodeTypes.COMMENT,
    content: normalizedContent,
    babelExp: {} as Expression,
  };
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

export function isTemplateVSlotNode(node: VueElementNode): boolean {
  return !!(node.props[0] && isCompilerVSlot(node.props[0]));
}
