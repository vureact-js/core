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
import { isClassAttr } from '../../shared/prop-ir-utils';

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
  let hasClassOrId = false;

  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      // 检查是否已经有 scopeId 属性
      if (prop.name === scopeId) {
        hasScopeId = true;
        break; // 找到 scopeId 就可以提前退出
      }

      // 检查是否有 class 或 id 属性
      if (getHasClassOrId(prop.name)) {
        // class 和 id 属性通常用于样式选择器，
        // 如果元素已经有这些属性，说明它很可能需要样式作用域，
        // 这样避免给不需要样式的元素添加 scopeId
        hasClassOrId = true;
        break;
      }
    }

    // 检查是否有 :class 或 :id 属性
    if (prop.type === NodeTypes.DIRECTIVE && prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION) {
      if (getHasClassOrId(prop.arg.content)) {
        hasClassOrId = true;
        break;
      }
    }
  }

  if (hasScopeId || !hasClassOrId) return;

  const attr: AttributeNode = {
    type: NodeTypes.ATTRIBUTE,
    name: scopeId,
    value: undefined,
    loc: node.loc,
    nameLoc: { ...node.loc, source: scopeId },
  };

  node.props.push(attr);
}

function getHasClassOrId(ns: string): boolean {
  return isClassAttr(ns) || ns === 'id';
}
