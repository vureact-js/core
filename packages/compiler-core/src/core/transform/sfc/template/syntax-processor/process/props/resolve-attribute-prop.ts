import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import { createPropsIR } from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { PropTypes } from '@src/core/transform/sfc/template/shared/types';
import { AttributeNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { resolvePropertyIR } from './resolve-dynamic-attribute-prop';
import { resolveStaticIsProp } from './resolve-is-prop';
import { resolveRefProp } from './resolve-ref-prop';

export function resolveAttributeProp(
  node: AttributeNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const name = node.name;
  const content = node.value?.content ?? 'true';

  if (name === 'is') {
    resolveStaticIsProp(content, ir, ctx, nodeIR);
    return;
  }

  if (name === 'ref') {
    resolveRefProp(node, ctx, nodeIR);
    return;
  }

  const attrIR = createPropsIR(name, name, content);
  attrIR.type = PropTypes.ATTRIBUTE;
  attrIR.value.isStringLiteral = true;

  resolvePropertyIR(attrIR, ir, ctx, nodeIR);
}
