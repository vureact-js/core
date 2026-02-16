import { ICompilationContext } from '@compiler/context/types';
import { createPropsIR, resolvePropAsBabelExp } from '@transform/template/shared/prop-ir-utils';
import { AttributeNode, DirectiveNode, NodeTypes, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../resolve-element-node';
import { PropsIR } from './resolve-props';

export function resolveRefProp(
  node: AttributeNode | DirectiveNode,
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
) {
  const { templateData } = ctx;

  let propIR: PropsIR;

  if (node.type === NodeTypes.ATTRIBUTE) {
    // 字符串标签名替换成对应的 useTemplateRef 变量名
    const tagName = node.value?.content;
    const binding = Object.values(templateData.refBindings).find((r) => r.tag === tagName);

    propIR = createPropsIR('ref', 'ref', binding?.name || 'null');
  } else {
    // 处理 :ref 值
    const exp = node.exp as SimpleExpressionNode;

    // 为 useTemplateRef 的变量访问，添加 .current 属性
    for (const name in templateData.refBindings) {
      const newName = `${name}.current`;
      const regex = new RegExp(`${name}(?!\\.current)`, 'g');
      exp.content = exp.content.replace(regex, newName);
    }

    propIR = createPropsIR(':ref', 'ref', exp.content);
  }

  resolvePropAsBabelExp(propIR, ctx);
  nodeIR.props.push(propIR);
}
