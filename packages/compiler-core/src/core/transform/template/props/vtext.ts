import { parseTemplateExp } from '@shared/babel-utils';
import { ElementNodeIR } from '../elements/node';
import { createInterpolationNodeIR } from '../elements/node-creators';

export function handleVText(content: string, nodeIR: ElementNodeIR) {
  const interpIR = createInterpolationNodeIR(content);
  interpIR.babelExp = parseTemplateExp(content);
  nodeIR.children = [interpIR];
}
