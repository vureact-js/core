import * as t from '@babel/types';
import { TemplateChildNodeIR } from '@core/transform/template';
import { BaseSimpleNodeIR } from '@core/transform/template/shared/create-simple-node';
import { NodeTypes } from '@core/transform/template/shared/node-types';
import { ElementNodeIR } from '@src/core/transform/template/elements/node';
import { JSXChild, JSXProp } from '../types';
import { buildProps } from './prop-builder';
import { buildFragment, buildJSXExpression, buildText } from './simple-builder';

export function buildElement(nodeIR: TemplateChildNodeIR): JSXChild | null {
  const isFragment = nodeIR.type === NodeTypes.FRAGMENT;
  const isElement = nodeIR.type === NodeTypes.ELEMENT;

  if (isFragment || isElement) {
    const node = nodeIR as ElementNodeIR;

    const children = node.children
      .map((child) => buildElement(child))
      .filter(Boolean) as JSXChild[];

    if (isFragment) {
      return buildFragment(children);
    }

    // todo 条件节点、map节点

    const props = buildProps(node.props);
    return createElement(node.tag, props, children, node.isSelfClosing);
  }

  const isText = nodeIR.type === NodeTypes.TEXT;
  const isComment = nodeIR.type === NodeTypes.COMMENT;

  if (isText || isComment) {
    const node = nodeIR as BaseSimpleNodeIR;
    return buildText(node.content, isComment);
  }

  if (nodeIR.type === NodeTypes.JSX_INTERPOLATION) {
    const node = nodeIR as BaseSimpleNodeIR;
    return buildJSXExpression(node.content);
  }

  return null;
}

export function createElement(
  tag: string,
  props: JSXProp[],
  children: JSXChild[],
  selfClosing?: boolean,
): t.JSXElement {
  const jsxTag = t.jsxIdentifier(tag);

  return t.jsxElement(
    t.jsxOpeningElement(jsxTag, props),
    t.jsxClosingElement(jsxTag),
    children,
    selfClosing,
  );
}
