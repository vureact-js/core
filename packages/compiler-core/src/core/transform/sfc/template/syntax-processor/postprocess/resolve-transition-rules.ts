import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { TemplateBlockIR } from '@transform/sfc/template';
import { addKeyToNodeIR } from '@transform/sfc/template/shared/prop-ir-utils';
import { NodeTypes } from '@transform/sfc/template/shared/types';
import { ElementNodeIR } from '../process';

export function resolveTransitionRules(
  nodeIR: ElementNodeIR,
  parentIR: ElementNodeIR,
  ir: TemplateBlockIR,
  ctx: ICompilationContext,
) {
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
