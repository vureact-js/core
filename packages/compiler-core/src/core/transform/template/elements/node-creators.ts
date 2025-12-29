import { Expression } from '@babel/types';
import { TemplateChildNodeIR } from '..';
import { NodeTypes } from '../shared/types';

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
  const newContent = !isComment ? content : `/*${content}*/`;
  return {
    type: !isComment ? NodeTypes.TEXT : NodeTypes.COMMENT,
    content: newContent,
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
