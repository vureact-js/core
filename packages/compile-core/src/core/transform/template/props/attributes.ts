import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { strCodeTypes } from '@shared/string-code-types';
import {
  AttributeNode,
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from '../elements/node';
import { preParseProp } from '../shared/pre-parse/prop';
import { PropsIR, PropTypes } from './index';
import { handleDynamicIs, handleStaticIs } from './is';
import { mergePropsIR } from './merge';
import { parseStyleString } from './style';
import { createPropsIR, isClassAttr, isStyleAttr } from './utils';

export function handleAttribute(prop: AttributeNode, nodeIR: ElementNodeIR) {
  const name = prop.name;
  const content = prop.value?.content ?? 'true';

  // 特殊处理：is
  if (name === 'is') {
    handleStaticIs(content, nodeIR);
    return;
  }

  const attr = createPropsIR(name, name, content);

  attr.type = PropTypes.ATTRIBUTE;
  attr.value.isStringLiteral = true;

  // 特殊处理：ref 收集
  if (name === 'ref') {
    const { nodeRefs } = compileContext.context;
    nodeRefs.add(content);
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

  processPropsIR(dynamicAttr, nodeIR, true, node.props);
}

function processPropsIR(
  attr: PropsIR,
  nodeIR: ElementNodeIR,
  isDynamic?: boolean,
  vueProps?: any[],
) {
  let content = attr.value.content;

  // 处理无参数 v-bind
  if (attr.rawName === 'v-bind' && !attr.name) {
    attr.isKeyLessVBind = true;
    warnKeyLessVBind(vueProps!, attr);
  }

  // 处理 style 属性的特殊情况
  if (attr.name === 'style') {
    attr.value.isStringLiteral = false;
    content = attr.value.content = parseStyleString(content);
  }

  if (isDynamic) {
    attr.value.isStringLiteral = strCodeTypes.isStringLiteral(content);
  }

  // 查找已存在的同名属性
  const found = nodeIR.props.find(
    (p) =>
      p.type !== PropTypes.SLOT &&
      attr.type !== PropTypes.SLOT &&
      p.name === attr.name &&
      p.isStatic &&
      attr.isStatic,
  ) as PropsIR;

  if (found) {
    mergePropsIR(found as PropsIR, attr);
  } else {
    nodeIR.props.push(attr);
  }

  preParseProp(found ?? attr);
}

function warnKeyLessVBind(vueProps: (AttributeNode | DirectiveNode)[], propsIR: PropsIR) {
  const strObj = propsIR.value.content;

  vueProps.some((prop) => {
    // 只检查 class 和 style，vue 只支持这两个属性的值合并
    if (isClassAttr(prop.name) || isStyleAttr(prop.name)) {
      const key = `${prop.name}:`;

      // 警告可能被覆盖
      if (strObj.includes(key)) {
        const { source, filename } = compileContext.context;

        logger.warn(
          `Because of the keyless v-bind, '${key.replace(':', '')}' has been specified multiple times; the latest value will override previous ones.`,
          {
            source,
            loc: prop.loc,
            file: filename,
          },
        );
      }

      return true;
    }
  });
}
