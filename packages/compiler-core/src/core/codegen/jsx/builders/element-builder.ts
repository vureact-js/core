import * as t from '@babel/types';
import { TemplateChildNodeIR } from '@core/transform/template';
import { BaseSimpleNodeIR } from '@core/transform/template/elements/node-creators';
import { ElementNodeIR } from '@src/core/transform/template/elements/node';
import { NodeTypes } from '@src/core/transform/template/shared/types';
import { buildChildren } from '..';
import { JSXChild, JSXProp } from '../types';
import { buildCondition } from './condition-builder';
import { buildLoop } from './loop-builder';
import { buildMemo } from './memo-builder';
import { buildProps } from './prop-builder';
import { buildFragment, buildJSXExpression, buildText } from './simple-builder';

export function buildElement(nodeIR: TemplateChildNodeIR): JSXChild | null {
  const simpleNode = nodeIR as unknown as BaseSimpleNodeIR;

  if (nodeIR.type === NodeTypes.TEXT) {
    return buildText(simpleNode.content);
  }

  if (nodeIR.type === NodeTypes.COMMENT || nodeIR.type === NodeTypes.JSX_INTERPOLATION) {
    return buildJSXExpression(simpleNode.babelExp);
  }

  const elNode = nodeIR as ElementNodeIR;

  if (elNode.isHandled && !(elNode as any).__processing) {
    return null;
  }

  if (nodeIR.type === NodeTypes.FRAGMENT) {
    return buildFragment(buildChildren(elNode.children, false) as JSXChild[]);
  }

  if (nodeIR.type === NodeTypes.ELEMENT) {
    const meta = elNode.meta;

    if (meta?.condition && !meta.condition.isHandled) {
      return buildCondition(elNode);
    }

    if (meta?.memo?.isMemo && !meta.memo.isHandled) {
      return buildMemo(elNode);
    }

    if (meta?.loop?.isLoop && !meta.loop.isHandled) {
      return buildLoop(elNode);
    }

    const props = buildProps(elNode.props);
    const children = buildChildren(elNode.children) as JSXChild[];

    return createElement(elNode.tag, props, children, elNode.isSelfClosing);
  }

  return null;
}

function createElement(
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
