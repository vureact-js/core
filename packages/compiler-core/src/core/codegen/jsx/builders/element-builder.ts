import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { TemplateChildNodeIR } from '@core/transform/template';
import { BaseSimpleNodeIR } from '@core/transform/template/elements/node-creators';
import { ElementNodeIR } from '@src/core/transform/template/elements/element';
import { NodeTypes } from '@src/core/transform/template/shared/types';
import { buildChildren } from '..';
import { createElement } from '../shared';
import { JSXChild } from '../types';
import { buildCondition } from './condition-builder';
import { buildLoop } from './loop-builder';
import { buildMemo } from './memo-builder';
import { buildProps } from './prop-builder';
import { buildFragment, buildJSXExpression, buildText } from './simple-builder';

export function buildElement(
  ctx: ICompilationContext,
  nodeIR: TemplateChildNodeIR | t.Node,
): JSXChild | null {
  if (t.isNode(nodeIR)) {
    return nodeIR as JSXChild;
  }

  const simpleNode = nodeIR as unknown as BaseSimpleNodeIR;

  if (nodeIR.type === NodeTypes.TEXT) {
    return buildText(simpleNode.content);
  }

  if (nodeIR.type === NodeTypes.COMMENT || nodeIR.type === NodeTypes.JSX_INTERPOLATION) {
    return buildJSXExpression(simpleNode.babelExp);
  }

  const elNode = nodeIR as ElementNodeIR;

  if (elNode.conditionIsHandled && !(elNode as any).__processing) {
    return null;
  }

  if (nodeIR.type === NodeTypes.FRAGMENT) {
    return buildFragment(buildChildren(ctx, elNode.children, false) as JSXChild[]);
  }

  if (nodeIR.type === NodeTypes.ELEMENT) {
    const meta = elNode.meta;

    if (meta?.condition && !meta.condition.isHandled) {
      return buildCondition(ctx, elNode);
    }

    if (meta?.memo?.isMemo && !meta.memo.isHandled) {
      return buildMemo(ctx, elNode);
    }

    if (meta?.loop?.isLoop && !meta.loop.isHandled) {
      return buildLoop(ctx, elNode);
    }

    const props = buildProps(ctx, elNode);
    const children = buildChildren(ctx, elNode.children) as JSXChild[];

    return createElement(elNode.tag, props, children, elNode.isSelfClosing);
  }

  return null;
}
