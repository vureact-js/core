import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/sfc/template';
import { createPropsIR } from '@transform/sfc/template/shared/prop-ir-utils';
import { PropTypes } from '@transform/sfc/template/shared/types';
import { AttributeNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { resolvePropertyIR } from './resolve-dynamic-attribute-prop';
import { resolveStaticIsProp } from './resolve-is-prop';
import { resolveRefProp } from './resolve-ref-prop';

export function resolveAttributeProp(
  attribute: AttributeNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const name = attribute.name;
  const content = attribute.value?.content ?? 'true';

  if (name === 'is') {
    resolveStaticIsProp(content, ir, ctx, nodeIR);
    return;
  }

  if (name === 'ref') {
    resolveRefProp(attribute, ctx, nodeIR);
    return;
  }

  const attrIR = createPropsIR(name, name, content);
  attrIR.type = PropTypes.ATTRIBUTE;
  attrIR.value.isStringLiteral = true;

  resolvePropertyIR(attrIR, ir, ctx, nodeIR);
}
