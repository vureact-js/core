import * as t from '@babel/types';
import { JSXChild, JSXProp } from '../types';

export function createJsxElement(
  tag: string,
  props: JSXProp[],
  children: JSXChild[],
  selfClosing?: boolean,
): t.JSXElement {
  const jsxTag = t.jsxIdentifier(tag);
  const isSelfClosing = selfClosing ?? !children.length;

  return t.jsxElement(
    t.jsxOpeningElement(jsxTag, props, isSelfClosing),
    t.jsxClosingElement(jsxTag),
    children,
  );
}
