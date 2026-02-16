import { TemplateBlockIR, TemplateChildNodeIR } from '@transform/template';
import { createTextNodeIR } from '@transform/template/shared/node-ir-utils';
import { TextNode } from '@vue/compiler-core';

export function resolveTextNode(
  node: TextNode,
  _ir: TemplateBlockIR,
  _ctx: unknown,
  childrenIR: TemplateChildNodeIR[],
) {
  childrenIR.push(createTextNodeIR(node.content));
}
