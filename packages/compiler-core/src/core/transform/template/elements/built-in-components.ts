import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { recordImport } from '@src/core/transform/shared/record-import';
import { SourceLocation } from '@vue/compiler-core';
import { addKeyToNode } from '../shared/utils';
import { ElementNodeIR } from './element';
import { ADAPTER_COMPS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';

export function markBuiltinComponent(ctx: ICompilationContext, nodeIR: ElementNodeIR) {
  if (nodeIR.tag in ADAPTER_COMPS) {
    nodeIR.isBuiltIn = true;
    recordImport(ctx, PACKAGE_NAME.runtime, nodeIR.tag);
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
