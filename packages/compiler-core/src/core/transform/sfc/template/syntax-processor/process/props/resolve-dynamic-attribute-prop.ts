import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  checkPropIsDynamicKey,
  createPropsIR,
  findSameProp,
  isStyleAttr,
  isVBind,
  resolvePropAsBabelExp,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { mergePropsIR } from '@src/core/transform/sfc/template/shared/prop-merge-utils';
import { parseStyleString } from '@src/core/transform/sfc/template/shared/style-utils';
import { warnUnsupportedVueDollarVar } from '@src/core/transform/sfc/template/shared/warning-utils';
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
    const isStringLiteral = strCodeTypes.isStringLiteral(content);

    // fix: 在字符串的情况下某些内容还带着单引号，需规范化
    if (isStringLiteral) {
      content = normalizeString(content);
      node.value.content = content;
    }

    // 该节点标记为字符串类型，踢出动态类型
    node.value.isStringLiteral = isStringLiteral;
  }

  const existing = findSameProp(nodeIR.props, node);

  if (existing) {
    mergePropsIR(ctx, existing, node);
  } else {
    nodeIR.props.push(node);
  }

  resolvePropAsBabelExp(existing ?? node, ctx);
}

function normalizeString(s: string): string {
  if (s.startsWith("'") && s.endsWith("'")) {
    // 替换 'xxx' -> xxxx
    return s.slice(1, -1);
  }
  return s;
}
