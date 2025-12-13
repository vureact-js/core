import { compileContext } from '@shared/compile-context';
import { strCodeTypes } from '@shared/string-code-types';
import {
  AttributeNode,
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { checkPropIsDynamicKey } from '../shared/check-prop-dynamic-key';
import { preParseProp } from '../shared/pre-parse/prop';
import { PropsIR, PropTypes } from './index';
import { handleDynamicIs, handleStaticIs } from './is';
import { mergePropsIR } from './merge';
import { parseStyleString } from './style';
import { createPropsIR } from './utils';

export function handleAttribute(prop: AttributeNode, nodeIR: ElementNodeIR) {
  const name = prop.name;
  const content = prop.value?.content ?? 'true';

  // 特殊处理：is
  if (name === 'is') {
    handleStaticIs(content, nodeIR);
    return;
  }

  const attr = createPropsIR(name, name, content);

  // 特殊处理：ref 收集
  if (name === 'ref') {
    const { nodeRefs } = compileContext.context;
    nodeRefs.add(content);
  } else {
    attr.type = PropTypes.ATTRIBUTE;
    attr.value.isStringLiteral = true;
  }

  processPropsIR(attr, nodeIR);
}

export function handleDynamicAttribute(
  prop: DirectiveNode,
  node: VueElementNode,
  nodeIR: ElementNodeIR,
) {
  const arg = prop.arg as SimpleExpressionNode;
  const exp = prop.exp as SimpleExpressionNode;

  const name = arg?.content ?? '';
  const content = exp?.content ?? 'true';

  // 特殊处理：is
  if (name === 'is') {
    handleDynamicIs(prop, nodeIR);
    return;
  }

  const dynamicAttr = createPropsIR(prop.rawName!, name, content);
  dynamicAttr.isStatic = arg?.isStatic ?? true;

  checkPropIsDynamicKey(prop);
  processPropsIR(dynamicAttr, nodeIR, true);
}

function processPropsIR(propIR: PropsIR, nodeIR: ElementNodeIR, isDynamic?: boolean) {
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
  const found = nodeIR.props.find(
    (p) =>
      p.type !== PropTypes.SLOT &&
      propIR.type !== PropTypes.SLOT &&
      p.name === propIR.name &&
      p.isStatic &&
      propIR.isStatic,
  ) as PropsIR;

  if (found) {
    mergePropsIR(found as PropsIR, propIR);
  } else {
    nodeIR.props.push(propIR);
  }

  preParseProp(found ?? propIR);
}
