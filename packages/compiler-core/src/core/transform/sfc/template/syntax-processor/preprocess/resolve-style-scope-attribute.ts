import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/sfc/template';
import {
  AttributeNode,
  isSlotOutlet,
  isTemplateNode,
  NodeTypes,
  ElementNode as VueElementNode,
  ParentNode as VueParentNode,
  RootNode as VueRootNode,
} from '@vue/compiler-core';

export function resolveStyleScopeAttribute(
  node: VueRootNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  if (!ctx.styleData.scopeId) {
    return;
  }

  walkElementNodes(node, (elementNode) => injectStyleScopeAttribute(elementNode, ctx));
}

function walkElementNodes(node: VueParentNode, onElement: (node: VueElementNode) => void) {
  for (const child of node.children) {
    if (child.type !== NodeTypes.ELEMENT) {
      continue;
    }

    onElement(child);

    if (child.children.length) {
      walkElementNodes(child, onElement);
    }
  }
}

function injectStyleScopeAttribute(node: VueElementNode, ctx: ICompilationContext) {
  const { scopeId } = ctx.styleData;

  // fix: template / slot 出口节点不应注入 scopeId，否则会被当作作用域参数
  if (!scopeId || isSlotOutlet(node) || isTemplateNode(node)) {
    return;
  }

  let hasScopeId = false;

  for (const prop of node.props) {
    if (prop.type !== NodeTypes.ATTRIBUTE) {
      continue;
    }

    // 检查是否已经有 scopeId 属性，
    // 如 'data-css-abc123' === 'data-css-abc123'
    if (prop.name === scopeId) {
      hasScopeId = true;
      break; // 找到 scopeId 就可以提前退出
    }

    // fix: https://github.com/vureact-js/core/issues/21
  }

  if (hasScopeId) return;

  const attr: AttributeNode = {
    type: NodeTypes.ATTRIBUTE,
    name: scopeId,
    value: undefined,
    loc: node.loc,
    nameLoc: { ...node.loc, source: scopeId },
  };

  node.props.push(attr);
}
