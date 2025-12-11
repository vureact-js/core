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

  const elNode = nodeIR as ElementNodeIR;

  if (isFragment || isElement) {
    const children = elNode.children
      .map((child) => buildElement(child))
      .filter(Boolean) as JSXChild[];

    if (isFragment) {
      return buildFragment(children);
    }

    // todo 条件节点、map节点、memo节点

    const props = buildProps(elNode.props);
    return createElement(elNode.tag, props, children, elNode.isSelfClosing);
  }

  const simpleNode = elNode as unknown as BaseSimpleNodeIR;

  if (nodeIR.type === NodeTypes.TEXT) {
    return buildText(simpleNode.content);
  }

  if (nodeIR.type === NodeTypes.COMMENT) {
    return buildJSXExpression(simpleNode.babelExp);
  }

  if (nodeIR.type === NodeTypes.JSX_INTERPOLATION) {
    return buildJSXExpression(simpleNode.babelExp);
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
