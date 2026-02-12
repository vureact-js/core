import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_COMPS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { strCodeTypes } from '@shared/string-code-types';
import { recordImport } from '@src/core/transform/shared/record-import';
import { camelCase } from '@utils/camelCase';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { resolvePropAsBabelExp } from '../shared/resolve-prop-exp';
import { createPropsIR } from './utils';

export function handleStaticIs(ctx: ICompilationContext, content: string, nodeIR: ElementNodeIR) {
  if (!content) return;

  if (content.startsWith('vue:')) {
    const name = content.split('vue:')[1]!;
    nodeIR.tag = camelCase(name);
    return;
  }

  const propIR = createPropsIR('is', 'is', content);

  propIR.value.isStringLiteral = true;

  resolvePropAsBabelExp(ctx, propIR);
  nodeIR.props.push(propIR);
}

export function handleDynamicIs(
  ctx: ICompilationContext,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
) {
  const exp = prop.exp as SimpleExpressionNode;
  const is = exp.content;

  if (strCodeTypes.isStringLiteral(is)) {
    handleStaticIs(ctx, is, nodeIR);
    return;
  }

  const propIR = createPropsIR('is', 'is', is);

  resolvePropAsBabelExp(ctx, propIR);

  nodeIR.tag = ADAPTER_COMPS.Component;
  nodeIR.isComponent = true;
  nodeIR.props.push(propIR);

  recordImport(ctx, PACKAGE_NAME.runtime, nodeIR.tag);
}
