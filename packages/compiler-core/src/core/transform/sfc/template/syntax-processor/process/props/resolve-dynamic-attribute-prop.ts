import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { TemplateBlockIR } from '@transform/sfc/template';
import {
  checkPropIsDynamicKey,
  createPropsIR,
  findSameProp,
  isStyleAttr,
  isVBind,
  resolvePropAsBabelExp,
} from '@transform/sfc/template/shared/prop-ir-utils';
import { mergePropsIR } from '@transform/sfc/template/shared/prop-merge-utils';
import { parseStyleString } from '@transform/sfc/template/shared/style-utils';
import { warnUnsupportedVueDollarVar } from '@transform/sfc/template/shared/warning-utils';
import {
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { resolveDynamicIsProp } from './resolve-is-prop';
import { PropsIR } from './resolve-props';
import { resolveRefProp } from './resolve-ref-prop';
import { resolveTemplateNodeKey } from './resolve-template-key';

export function resolveDynamicAttributeProp(
  directive: DirectiveNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  vueNode: VueElementNode,
  nodeIR: ElementNodeIR,
) {
  const arg = directive.arg as SimpleExpressionNode;
  const exp = directive.exp as SimpleExpressionNode;

  const name = arg?.content ?? '';
  const content = exp?.content ?? 'true';

  warnUnsupportedVueDollarVar(ctx, directive);

  if (name === 'is') {
    resolveDynamicIsProp(directive, ir, ctx, nodeIR);
    return;
  }

  if (name === 'ref') {
    resolveRefProp(directive, ctx, nodeIR);
    return;
  }

  // fix: https://github.com/vureact-js/core/issues/11
  if (vueNode.tag === 'template' && name === 'key') {
    resolveTemplateNodeKey(vueNode, content, ctx);
    return;
  }

  const propIR = createPropsIR(directive.rawName!, name, content);
  propIR.isStatic = arg?.isStatic ?? true;

  checkPropIsDynamicKey(ctx, directive);
  resolvePropertyIR(propIR, ir, ctx, nodeIR, true);
}

export function resolvePropertyIR(
  propsIR: PropsIR,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
  isDynamic = false,
) {
  let content = propsIR.value.content;

  if (isVBind(propsIR.rawName) && !propsIR.name) {
    propsIR.isKeyLessVBind = true;
  }

  if (isStyleAttr(propsIR.name)) {
    propsIR.value.isStringLiteral = false;
    content = propsIR.value.content = parseStyleString(content);
  }

  if (isDynamic) {
    const isStringLiteral = strCodeTypes.isStringLiteral(content);

    // fix: 在字符串的情况下某些内容还带着单引号，需规范化
    if (isStringLiteral) {
      content = normalizeString(content);
      propsIR.value.content = content;
    }

    // 该节点标记为字符串类型，踢出动态类型
    propsIR.value.isStringLiteral = isStringLiteral;
  }

  const existing = findSameProp(nodeIR.props, propsIR);

  if (existing) {
    mergePropsIR(ctx, existing, propsIR);
  } else {
    nodeIR.props.push(propsIR);
  }

  resolvePropAsBabelExp(existing ?? propsIR, ctx);
}

function normalizeString(s: string): string {
  if (s.startsWith("'") && s.endsWith("'")) {
    // 替换 'xxx' -> xxxx
    return s.slice(1, -1);
  }
  return s;
}
