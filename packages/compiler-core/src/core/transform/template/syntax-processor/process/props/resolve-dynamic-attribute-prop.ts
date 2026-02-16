import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { TemplateBlockIR } from '@transform/template';
import {
  checkPropIsDynamicKey,
  createPropsIR,
  findSameProp,
  isStyleAttr,
  isVBind,
  resolvePropAsBabelExp,
} from '@transform/template/shared/prop-ir-utils';
import { mergePropsIR } from '@transform/template/shared/prop-merge-utils';
import { parseStyleString } from '@transform/template/shared/style-utils';
import { warnUnsupportedVueDollarVar } from '@transform/template/shared/warning-utils';
import { DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { resolveDynamicIsProp } from './resolve-is-prop';
import { PropsIR } from './resolve-props';
import { resolveRefProp } from './resolve-ref-prop';

export function resolveDynamicAttributeProp(
  node: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const arg = node.arg as SimpleExpressionNode;
  const exp = node.exp as SimpleExpressionNode;

  const name = arg?.content ?? '';
  const content = exp?.content ?? 'true';

  warnUnsupportedVueDollarVar(ctx, node);

  if (name === 'is') {
    resolveDynamicIsProp(node, ir, ctx, nodeIR);
    return;
  }

  if (name === 'ref') {
    resolveRefProp(node, ctx, nodeIR);
    return;
  }

  const dynamicPropIR = createPropsIR(node.rawName!, name, content);
  dynamicPropIR.isStatic = arg?.isStatic ?? true;

  checkPropIsDynamicKey(ctx, node);
  resolvePropertyIR(dynamicPropIR, ir, ctx, nodeIR, true);
}

export function resolvePropertyIR(
  node: PropsIR,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
  isDynamic = false,
) {
  let content = node.value.content;

  if (isVBind(node.rawName) && !node.name) {
    node.isKeyLessVBind = true;
  }

  if (isStyleAttr(node.name)) {
    node.value.isStringLiteral = false;
    content = node.value.content = parseStyleString(content);
  }

  if (isDynamic) {
    node.value.isStringLiteral = strCodeTypes.isStringLiteral(content);
  }

  const existing = findSameProp(nodeIR.props, node);

  if (existing) {
    mergePropsIR(ctx, existing, node);
  } else {
    nodeIR.props.push(node);
  }

  resolvePropAsBabelExp(existing ?? node, ctx);
}
