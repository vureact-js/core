import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { logger } from '@shared/logger';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import { SourceLocation } from '@vue/compiler-core';
import { addKeyToNode } from '../shared/utils';
import { ElementNodeIR } from './element';

export function markBuiltinComponent(ctx: ICompilationContext, nodeIR: ElementNodeIR) {
  if (nodeIR.tag in VuR_Runtime) {
    nodeIR.isBuiltIn = true;
    recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, nodeIR.tag, true);
  }
}

export function handleBuiltinComponent(
  ctx: ICompilationContext,
  nodeIR: ElementNodeIR,
  parentIR: ElementNodeIR,
  loc: SourceLocation,
) {
  if (!parentIR?.isBuiltIn) return;

  const { show, condition } = nodeIR.meta;
  const { tag: parentTag, children: parentChildren } = parentIR;

  // handle transition component
  if (parentTag === 'Transition') {
    const { source, filename } = ctx;
    const loggerOpts = {
      source,
      loc,
      file: filename,
    };

    if (parentChildren.length > 1) {
      const isAllConditionNodes = parentChildren.every((c) => (c as ElementNodeIR).meta.condition);
      if (!isAllConditionNodes) {
        logger.error('<Transition> expected exactly one node.', loggerOpts);
        return;
      }
    }

    if (!show && !condition) {
      logger.warn('Missing v-show or v-if; <Transition> requires one of them.', loggerOpts);
      return;
    }

    // add random key to node if necessarily
    const hasKey = nodeIR.props.some((p) => p.name === 'key');
    if (!hasKey) addKeyToNode(ctx, nodeIR);
  }
}
