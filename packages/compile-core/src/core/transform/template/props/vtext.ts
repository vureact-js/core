import { ElementNodeIR } from '../elements/node';
import { createTextNodeIR } from '../elements/text';

export function handleVText(content: string, nodeIR: ElementNodeIR) {
  nodeIR.children = [createTextNodeIR(content)];
}
