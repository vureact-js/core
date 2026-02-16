import { ICompilationContext } from '@compiler/context/types';
import { TemplateBlockIR } from '@transform/template';
import { camelCase } from '@utils/camelCase';
import {
  AttributeNode,
  ElementTypes,
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

  if (!scopeId || isComponentElement(node)) {
    return;
  }

  const hasDynamicIs = node.props.some((prop) => {
    if (prop.type !== NodeTypes.DIRECTIVE || prop.arg?.type !== NodeTypes.SIMPLE_EXPRESSION) {
      return false;
    }

    return prop.arg.content === 'is';
  });

  const hasScopeId = node.props.some(
    (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === scopeId,
  );

  if (hasDynamicIs || hasScopeId) {
    return;
  }

  const attr: AttributeNode = {
    type: NodeTypes.ATTRIBUTE,
    name: scopeId,
    value: undefined,
    loc: node.loc,
    nameLoc: { ...node.loc, source: scopeId },
  };

  node.props.push(attr);
}

function isComponentElement(node: VueElementNode): boolean {
  if (node.tagType !== ElementTypes.COMPONENT) {
    return camelCase(node.tag) !== node.tag;
  }

  return node.tagType === ElementTypes.COMPONENT;
}
