import { parseFragmentExp } from '@shared/babel-utils';
import { ElementNodeIR } from '../elements/node';
import { createInterpolationNodeIR } from '../elements/node-creators';

export function handleVText(content: string, nodeIR: ElementNodeIR) {
  const interpIR = createInterpolationNodeIR(content);
  interpIR.babelExp = parseFragmentExp(content);
  nodeIR.children = [interpIR];
}
