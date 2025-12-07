import { NodeTypes } from './types';

export interface TextNodeIR {
  type: NodeTypes;
  content: string;
}

export function createTextNodeIR(content: string, isComment = false): TextNodeIR {
  return {
    type: !isComment ? NodeTypes.TEXT : NodeTypes.COMMENT,
    content,
  };
}
