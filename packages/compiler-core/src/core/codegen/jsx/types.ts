import * as t from '@babel/types';

export type JSXChild =
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment;

export type JSXProp = t.JSXAttribute | t.JSXSpreadAttribute;
