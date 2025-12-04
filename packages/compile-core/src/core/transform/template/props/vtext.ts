import { ElementNodeIR } from '../nodes/element';
import { createTextNodeIR } from '../nodes/text';

export function handleVText(content: string, nodeIR: ElementNodeIR) {
  nodeIR.children = [createTextNodeIR(content)];
}
