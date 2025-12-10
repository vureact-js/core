import { ElementNodeIR } from '../elements/node';
import { createTextNodeIR } from '../shared/create-simple-node';

export function handleVText(content: string, nodeIR: ElementNodeIR) {
  nodeIR.children = [createTextNodeIR(content)];
}
