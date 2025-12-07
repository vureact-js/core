import { NodeTypes } from './types';

export interface InterpolationNodeIR {
  type: NodeTypes;
  content: string;
  isIdentifier: boolean;
}

export function createInterpolationNodeIR(
  content: string,
  isIdentifier = true,
): InterpolationNodeIR {
  return {
    type: NodeTypes.JSX_INTERPOLATION,
    content,
    isIdentifier,
  };
}
