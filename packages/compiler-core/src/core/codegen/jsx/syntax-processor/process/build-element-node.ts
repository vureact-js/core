import { ICompilationContext } from '@compiler/context/types';
import { ElementNodeIR } from '@transform/template/syntax-processor/process';
import { JSXChild } from '../../types';
import { createJsxElement } from '../../utils/jsx-element-utils';
import { buildConditionNode } from './build-condition-node';
import { buildJsxChildren } from './build-jsx-children';
import { buildLoopNode } from './build-loop-node';
import { buildMemoNode } from './build-memo-node';
import { buildProps } from './build-props';

export function buildElementNode(nodeIR: ElementNodeIR, ctx: ICompilationContext): JSXChild | null {
  const mutableNodeIR = nodeIR as ElementNodeIR & { __processing?: boolean };

  if (nodeIR.conditionIsHandled && !mutableNodeIR.__processing) {
    return null;
  }

  const meta = nodeIR.meta;

  if (meta?.condition && !meta.condition.isHandled) {
    return buildConditionNode(nodeIR, ctx);
  }

  if (meta?.memo?.isMemo && !meta.memo.isHandled) {
    return buildMemoNode(nodeIR, ctx);
  }

  if (meta?.loop?.isLoop && !meta.loop.isHandled) {
    return buildLoopNode(nodeIR, ctx);
  }

  const props = buildProps(nodeIR, ctx);
  const children = buildJsxChildren(nodeIR.children, ctx);

  return createJsxElement(nodeIR.tag, props, children, nodeIR.isSelfClosing);
}
