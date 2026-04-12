import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { strCodeTypes } from '@shared/string-code-types';
import { TemplateBlockIR } from '@transform/sfc/template';
import { createPropsIR, resolvePropAsBabelExp } from '@transform/sfc/template/shared/prop-ir-utils';
import { recordImport } from '@transform/shared';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveStaticIsProp(
  content: string,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  if (!content) {
    return;
  }

  if (content.startsWith('vue:')) {
    const name = content.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
    return;
  }

  const propIR = createPropsIR('is', 'is', content);
  propIR.value.isStringLiteral = true;

  resolvePropAsBabelExp(propIR, ctx);
  nodeIR.props.push(propIR);
}

export function resolveDynamicIsProp(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = directive.exp as SimpleExpressionNode;
  const content = exp.content;

  if (strCodeTypes.isStringLiteral(content)) {
    resolveStaticIsProp(content, ir, ctx, nodeIR);
    return;
  }

  const propIR = createPropsIR('is', 'is', content);

  resolvePropAsBabelExp(propIR, ctx);

  nodeIR.tag = VUE_API_MAP.DynamicComponent;
  nodeIR.isComponent = true;
  nodeIR.props.push(propIR);

  recordImport(ctx, PACKAGE_NAME.runtime, nodeIR.tag);
}
