import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { strCodeTypes } from '@src/shared/string-code-types';
import {
  AttributeNode,
  DirectiveNode,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { enablePropsRuntimeAssistance } from '../../shared';
import { ElementNodeIR } from '../nodes/element';
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
  attr.value.isIdentifier = false;

  // 特殊处理：ref 收集
  if (name === 'ref') {
    const { nodeRefs } = compileContext.context;
    nodeRefs.add(content);
  }

  processPropsIR(attr, nodeIR, false);
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

  if (prop.rawName === 'v-bind' && !name) {
    dynamicAttr.isKeyLessVBind = true;
    existsInKeyLessVBind(node.props, dynamicAttr);
  }

  const isStaticKey = arg?.isStatic ?? true;
  const isIdentifier = !strCodeTypes.isStringLiteral(content);

  dynamicAttr.isStatic = isStaticKey;
  dynamicAttr.value.isIdentifier = isIdentifier;

  processPropsIR(dynamicAttr, nodeIR, true);
}

function processPropsIR(attr: PropsIR, nodeIR: ElementNodeIR, isDynamic: boolean) {
  // 处理 style 属性的特殊情况
  if (attr.name === 'style') {
    // 先解析为对象，后标记为标识符
    attr.value.content = parseStyleString(attr.value.content, attr.value.isIdentifier);
    attr.value.isIdentifier = true;
  }

  // 查找已存在的同名属性
  const found = nodeIR.props.find((p) => p.name === attr.name && (!isDynamic || attr.isStatic));

  if (found) {
    mergePropsIR(found as PropsIR, attr);
    enablePropsRuntimeAssistance(found as PropsIR);
    return;
  }

  // 动态属性需要启用运行时辅助
  if (isDynamic) {
    enablePropsRuntimeAssistance(attr);
  }

  nodeIR.props.push(attr);
}

function existsInKeyLessVBind(vueProps: (AttributeNode | DirectiveNode)[], propsIR: PropsIR) {
  const propIRContent = propsIR.value.content;

  // 不检查非对象值
  if (!strCodeTypes.isObjectLiteral(propIRContent)) return;

  vueProps.some((prop) => {
    // 只检查 class 和 style，vue 只支持这两个属性的值合并
    if (isClassAttr(prop.name) || isStyleAttr(prop.name)) {
      const key = `${prop.name}:`;

      if (propIRContent.includes(key)) {
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
