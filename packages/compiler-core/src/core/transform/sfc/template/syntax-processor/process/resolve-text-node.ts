import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { createTextNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { TextNode } from '@vue/compiler-core';

export function resolveTextNode(
  node: TextNode,
  _ir: TemplateBlockIR,
  _ctx: unknown,
  childrenIR: TemplateChildNodeIR[],
) {
  const textIR = createTextNodeIR(node.content.trim());
  childrenIR.push(textIR);
}
