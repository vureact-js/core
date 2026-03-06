import { ICompilationContext } from '@compiler/context/types';
import { HTML_TAG_TYPES } from '@consts/html-tag-types';
import {
  createPropsIR,
  resolvePropAsBabelExp,
} from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { AttributeNode, DirectiveNode, NodeTypes, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { PropsIR } from './resolve-props';

export function resolveRefProp(
  node: AttributeNode | DirectiveNode,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const {
    templateData: { refBindings },
  } = ctx;

  let propIR: PropsIR;

  if (node.type === NodeTypes.ATTRIBUTE) {
    const tag = node.value?.content;
    if (!tag) return;

    // 收集组件 ref 信息
    collectComponentRef(tag, ctx);

    const domRefBinding = Object.values(refBindings.domRefs).find((r) => r.tag === tag);
    const refVar = domRefBinding?.name || refBindings.componentRefs[tag]?.name;

    // 字符串标签名替换成对应的 useTemplateRef 变量名
    propIR = createPropsIR('ref', 'ref', refVar || 'null');
  } else {
    // 处理 :ref 值
    const exp = node.exp as SimpleExpressionNode;

    // 为 useTemplateRef 的变量访问，添加 .current 属性
    for (const name in refBindings.domRefs) {
      const newName = `${name}.current`;
      const regex = new RegExp(`${name}(?!\\.current)`, 'g');
      exp.content = exp.content.replace(regex, newName);
    }

    propIR = createPropsIR(':ref', 'ref', exp.content);
  }

  resolvePropAsBabelExp(propIR, ctx);
  nodeIR.props.push(propIR);
}

function collectComponentRef(tag: string, ctx: ICompilationContext) {
  // 如果标签不是HTML原生标签，则不需要收集组件ref
  if (tag in HTML_TAG_TYPES) {
    return;
  }

  const { refBindings, reactiveBindings } = ctx.templateData;

  // 在refBindings中注册组件ref信息
  refBindings.componentRefs[tag] = {
    tag, // 对应的标签名（随便填，不影响）
    htmlType: '',
    name: tag, // 对应的变量名（随便填，不影响）
  };

  // 如果该标签在reactiveBindings中存在，则删除（避免重复绑定）
  if (reactiveBindings[tag]) {
    delete reactiveBindings[tag];
  }
}
