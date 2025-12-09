import { NodeTypes } from './node-types';

export interface BaseSimpleNodeIR {
  type: NodeTypes;
  content: string;
  isIdentifier: boolean;
}

export function createInterpolationNodeIR(content: string, isIdentifier = true): BaseSimpleNodeIR {
  return {
    type: NodeTypes.JSX_INTERPOLATION,
    content,
    isIdentifier,
  };
}

export function createTextNodeIR(content: string, isComment = false): BaseSimpleNodeIR {
  return {
    type: !isComment ? NodeTypes.TEXT : NodeTypes.COMMENT,
    content,
    isIdentifier: false,
  };
}
