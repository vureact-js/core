import * as t from '@babel/types';
import { VUE_DIR, VUE_TO_REACT_PROP_MAP } from '@constants/vue';
import { isNull, isUndefined } from '@utils/types';
import { NodeTypes, type AttributeNode, type DirectiveNode } from '@vue/compiler-core';
import { buildForExpression, buildMemoExpression, buildTextExpression } from './buildExpression';
import { Conditionals, Structural } from './constants';
import { transformDirective } from './transformDirective';
import type { ExtendedDirectiveNode, ExtendedElementNode, ExtendJSXProps } from './types';

export function transformProps(
  props: ExtendedDirectiveNode[],
  elementNode: ExtendedElementNode,
): ExtendJSXProps[] {
  if (elementNode.pre) {
    return transformStaticAttributes(props);
  }

  const jsxProps: ExtendJSXProps[] = [];

  // Handle Structural directives
  const handleStructural = () => {
    const directives = props.filter(
      (prop) => prop.type === NodeTypes.DIRECTIVE && Structural.includes(prop.name),
    ) as ExtendedDirectiveNode[];

    directives.forEach((dir) => {
      // skip here — v-if chain handled in traverseChildren, because it requires a chain to find the node
      if (Conditionals.includes(dir.name)) {
        return;
      }
      if (dir.name === VUE_DIR.text) {
        const textExpr = buildTextExpression(elementNode);
        if (!isNull(textExpr)) {
          elementNode.jsxElement = t.jsxExpressionContainer(textExpr);
        }
        return;
      }
      if (dir.name === VUE_DIR.once || dir.name === VUE_DIR.memo) {
        const memoExpr = buildMemoExpression(elementNode);
        if (!isNull(memoExpr)) {
          elementNode.jsxElement = t.jsxExpressionContainer(memoExpr);
        }
        return;
      }
      if (dir.name === VUE_DIR.for) {
        const forExpr = buildForExpression(elementNode);
        if (!isNull(forExpr)) {
          elementNode.jsxElement = t.jsxExpressionContainer(forExpr);
        }
        return;
      }
    });
  };

  handleStructural();

  // Handle non-Structural directives and attributes
  const handleNonStructural = () => {
    props.forEach((prop: ExtendedDirectiveNode | AttributeNode) => {
      if (prop.type === NodeTypes.DIRECTIVE && !Structural.includes(prop.name)) {
        const jsxAttrs = transformDirective(prop, elementNode);
        if (jsxAttrs) {
          jsxProps.push(jsxAttrs);
        }
      } else if (prop.type === NodeTypes.ATTRIBUTE) {
        const attrName = VUE_TO_REACT_PROP_MAP[prop.name] || prop.name;
        jsxProps.push(
          t.jsxAttribute(
            t.jsxIdentifier(attrName),
            prop.value ? t.stringLiteral(prop.value.content) : null,
          ),
        );
      }
    });
  };

  handleNonStructural();

  return jsxProps;
}

export function mergeProps(
  oldProps: ExtendJSXProps[],
  newProps?: ExtendJSXProps[],
): (t.JSXAttribute | t.JSXSpreadAttribute)[] {
  if (isUndefined(newProps)) return oldProps as any[];
  return [...new Set(oldProps.concat(newProps))] as any[];
}

export function transformStaticAttributes(props: ExtendedDirectiveNode[]): t.JSXAttribute[] {
  return props
    .filter((prop: DirectiveNode | AttributeNode) => prop.type === NodeTypes.ATTRIBUTE)
    .map((prop) => {
      const attr = prop as unknown as AttributeNode;
      return t.jsxAttribute(
        t.jsxIdentifier(VUE_TO_REACT_PROP_MAP[attr.name] ?? attr.name),
        attr.value ? t.stringLiteral(attr.value.content) : null,
      );
    });
}
