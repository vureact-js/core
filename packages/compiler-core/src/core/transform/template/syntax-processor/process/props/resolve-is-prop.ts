import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_COMPS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { strCodeTypes } from '@shared/string-code-types';
import { recordImport } from '@transform/shared';
import { TemplateBlockIR } from '@transform/template';
import { createPropsIR, resolvePropAsBabelExp } from '@transform/template/shared/prop-ir-utils';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';

export function resolveStaticIsProp(
  node: string,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  if (!node) {
    return;
  }

  if (node.startsWith('vue:')) {
    const name = node.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
    return;
  }

  const propIR = createPropsIR('is', 'is', node);
  propIR.value.isStringLiteral = true;

  resolvePropAsBabelExp(propIR, ctx);
  nodeIR.props.push(propIR);
}

export function resolveDynamicIsProp(
  node: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const exp = node.exp as SimpleExpressionNode;
  const content = exp.content;

  if (strCodeTypes.isStringLiteral(content)) {
    resolveStaticIsProp(content, ir, ctx, nodeIR);
    return;
  }

  const propIR = createPropsIR('is', 'is', content);

  resolvePropAsBabelExp(propIR, ctx);

  nodeIR.tag = ADAPTER_COMPS.Component;
  nodeIR.isComponent = true;
  nodeIR.props.push(propIR);

  recordImport(ctx, PACKAGE_NAME.runtime, nodeIR.tag);
}
