import * as t from '@babel/types';
import type { TransformedImportInfo } from '@transform/types';
import type { CommentNode, TextNode } from '@vue/compiler-core';
import type {
  ExtendedDirectiveNode as ParsedDirectiveNode,
  ExtendedElementNode as ParsedElementNode,
  ExtendedInterpolationNode as ParsedInterpolationNode,
  ExtendedRootNode as ParsedRootNode,
} from 'parse/types';

interface JSXInfo {
  ast: t.JSXElement;
  context: JSXTransformContext;
}

interface JSXTransformContext {
  imports: TransformedImportInfo;
}

type ExtendedNode =
  | ExtendedRootNode
  | ExtendedElementNode
  | ExtendedDirectiveNode
  | ExtendedInterpolationNode
  | TextNode
  | CommentNode;

type ExtendedRootNode = ParsedRootNode & {
  jsxElement?: ExtendedNode;
};

type ExtendedElementNode = ParsedElementNode & {
  jsxProps?: ExtendJSXProps[];
  // For v-if, v-once, v-memo
  jsxElement?: ExtendJSXNode;
  // For default slot, v-for, v-text
  jsxChildren?: ExtendJSXNode;
  vIfHandled?: boolean;
};

type ExtendedDirectiveNode = ParsedDirectiveNode & {
  jsxAttribute?: t.JSXAttribute | t.JSXSpreadAttribute;
};

type ExtendedInterpolationNode = ParsedInterpolationNode & {
  jsxExpression?: t.JSXExpressionContainer;
};

type ExtendJSXNode = t.JSXFragment | t.JSXElement | t.JSXText | t.JSXExpressionContainer;

type ExtendJSXProps = t.JSXAttribute | t.JSXSpreadAttribute | null;

export type {
  ExtendedDirectiveNode,
  ExtendedElementNode,
  ExtendedInterpolationNode,
  ExtendedNode,
  ExtendedRootNode,
  ExtendJSXNode,
  ExtendJSXProps,
  JSXInfo,
  JSXTransformContext,
};
