import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { addKeyToNodeIR } from '@src/core/transform/sfc/template/shared/prop-ir-utils';
import { NodeTypes } from '@src/core/transform/sfc/template/shared/types';
import { RootNode as VueRootNode } from '@vue/compiler-core';
import { ElementNodeIR } from '../process';

export function resolveBuiltInComponentRules(
  _node: VueRootNode,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  resolveElementChildrenRules(ir.children, ctx, null, ir);
}

function resolveElementChildrenRules(
  children: TemplateChildNodeIR[],
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  ir: TemplateBlockIR,
) {
  for (const child of children) {
    if (child.type !== NodeTypes.ELEMENT) {
      continue;
    }

    const nodeIR = child as ElementNodeIR;

    if (parentIR?.isBuiltIn) {
      resolveBuiltInChildRules(nodeIR, parentIR, ir, ctx);
    }

    resolveElementChildrenRules(nodeIR.children, ctx, nodeIR, ir);
  }
}

function resolveBuiltInChildRules(
  nodeIR: ElementNodeIR,
  parentIR: ElementNodeIR,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
  if (parentIR.tag !== 'Transition') {
    return;
  }

  const loggerOptions = {
    source: ctx.source,
    loc: nodeIR.loc,
    file: ctx.filename,
  };

  if (parentIR.children.length > 1) {
    const isAllConditionNodes = parentIR.children.every((child) => {
      return child.type === NodeTypes.ELEMENT && !!(child as ElementNodeIR).meta.condition;
    });

    if (!isAllConditionNodes) {
      logger.error('<Transition> expected exactly one node.', loggerOptions);
      return;
    }
  }

  const { show, condition } = nodeIR.meta;

  if (!show && !condition) {
    logger.warn('Missing v-show or v-if; <Transition> requires one of them.', loggerOptions);
    return;
  }

  const hasKey = nodeIR.props.some((prop) => prop.name === 'key');

  if (!hasKey) {
    addKeyToNodeIR(nodeIR, ir, ctx);
  }
}
