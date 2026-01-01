import { ElementNodeIR } from '../elements/element';
import { createInterpolationNodeIR } from '../elements/node-creators';
import { resolveTemplateExp } from '../shared/resolve-str-exp';

export function handleVText(content: string, nodeIR: ElementNodeIR) {
  const interpIR = createInterpolationNodeIR(content);
  interpIR.babelExp = resolveTemplateExp(content);
  nodeIR.children = [interpIR];
}
