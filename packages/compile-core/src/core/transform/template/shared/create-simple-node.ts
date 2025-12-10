import { Expression } from '@babel/types';
import { NodeTypes } from './node-types';

export interface BaseSimpleNodeIR {
  type: NodeTypes;
  content: string;
  babelExp: Expression;
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
