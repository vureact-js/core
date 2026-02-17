import { ICompilationContext } from '@compiler/context/types';
import { STYLE_MODULE_NAME } from '@consts/other';
import { TemplateBlockIR } from '@src/core/transform/sfc/template';
import {
  DirectiveNode,
  NodeTypes,
  ElementNode as VueElementNode,
  ParentNode as VueParentNode,
  RootNode as VueRootNode,
} from '@vue/compiler-core';

export function resolveStyleModuleReference(
  node: VueRootNode,
  _ir: TemplateBlockIR,
  _ctx: ICompilationContext,
) {
  walkElementNodes(node, (elementNode) => {
    for (const prop of elementNode.props) {
      if (prop.type !== NodeTypes.DIRECTIVE) {
        continue;
      }

      resolveDefaultStyleModuleName(prop);
    }
  });
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

function resolveDefaultStyleModuleName(node: DirectiveNode) {
  const { exp } = node;

  if (exp?.type !== NodeTypes.SIMPLE_EXPRESSION) {
    return;
  }

  if (exp.content.includes('$style')) {
    exp.content = exp.content.replaceAll('$style', STYLE_MODULE_NAME);
  }
}
