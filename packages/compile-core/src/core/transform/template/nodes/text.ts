import { NodeTypes } from './types';

export interface TextNodeIR {
  type: NodeTypes;
  content: string;
}

export function createTextNodeIR(content: string): TextNodeIR {
  return {
    type: NodeTypes.TEXT,
    content,
  };
}
