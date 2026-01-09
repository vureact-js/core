import { ICompilationContext } from '@compiler/context/types';
import { strCodeTypes } from '@shared/string-code-types';
import { AttributeNode, DirectiveNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/element';
import { mergePropsIR } from '../shared/merge-props';
import { parseStyleString } from '../shared/parse-style-string';
import { preParseProp } from '../shared/pre-parse-props';
import { warnVueDollarVar } from '../shared/unsupported-warn';
import { checkPropIsDynamicKey, findSameProp } from '../shared/utils';
import { PropsIR, PropTypes } from './index';
import { handleDynamicIs, handleStaticIs } from './is';
import { createPropsIR } from './utils';

export function handleAttribute(
  ctx: ICompilationContext,
  prop: AttributeNode,
  nodeIR: ElementNodeIR,
) {
  const name = prop.name;
  const content = prop.value?.content ?? 'true';

  // 特殊处理：is
  if (name === 'is') {
    handleStaticIs(ctx, content, nodeIR);
    return;
  }

  const attr = createPropsIR(name, name, content);

  // 特殊处理：ref 收集
  if (name === 'ref') {
    ctx.templateData.refs.add(content);
  } else {
    attr.type = PropTypes.ATTRIBUTE;
    attr.value.isStringLiteral = true;
  }

  processPropsIR(ctx, attr, nodeIR);
}

export function handleDynamicAttribute(
  ctx: ICompilationContext,
  prop: DirectiveNode,
  nodeIR: ElementNodeIR,
) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const name = arg?.content ?? '';
  const content = exp?.content ?? 'true';

  warnVueDollarVar(ctx, prop);

  // 特殊处理：is
  if (name === 'is') {
    handleDynamicIs(ctx, prop, nodeIR);
    return;
  }

  const dynamicAttr = createPropsIR(prop.rawName!, name, content);
  dynamicAttr.isStatic = arg?.isStatic ?? true;

  checkPropIsDynamicKey(ctx, prop);
  processPropsIR(ctx, dynamicAttr, nodeIR, true);
}

function processPropsIR(
  ctx: ICompilationContext,
  propIR: PropsIR,
  nodeIR: ElementNodeIR,
  isDynamic?: boolean,
) {
  let content = propIR.value.content;

  // 处理无参数 v-bind
  if (propIR.rawName === 'v-bind' && !propIR.name) {
    propIR.isKeyLessVBind = true;
  }

  // 处理 style 属性的特殊情况
  if (propIR.name === 'style') {
    propIR.value.isStringLiteral = false;
    content = propIR.value.content = parseStyleString(content);
  }

  if (isDynamic) {
    propIR.value.isStringLiteral = strCodeTypes.isStringLiteral(content);
  }

  // 查找已存在的同名属性
  const found = findSameProp(nodeIR.props, propIR);

  if (found) {
    mergePropsIR(ctx, found, propIR);
  } else {
    nodeIR.props.push(propIR);
  }

  preParseProp(ctx, found ?? propIR);
}
