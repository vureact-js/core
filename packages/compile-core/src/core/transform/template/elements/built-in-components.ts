import { RuntimeModules, RV3_Components } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { recordImport } from '@shared/runtime-utils';
import { SourceLocation } from '@vue/compiler-core';
import { addKeyToNode } from '../shared/utils';
import { ElementNodeIR } from './node';

export function markBuiltinComponent(nodeIR: ElementNodeIR) {
  if (nodeIR.isComponent && nodeIR.tag in RV3_Components) {
    nodeIR.isBuiltIn = true;
    recordImport(RuntimeModules.RV3_COMPONENTS, nodeIR.tag, true);
  }
}

export function handleBuiltinComponent(
  nodeIR: ElementNodeIR,
  parentIR: ElementNodeIR,
  loc: SourceLocation,
) {
  if (!parentIR?.isBuiltIn) return;

  const { show, condition } = nodeIR.meta;
  const { tag: parentTag, children: parentChildren } = parentIR;

  // handle transition component
  if (parentTag === 'Transition') {
    const { source, filename } = compileContext.context;
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
    if (!hasKey) addKeyToNode(nodeIR);
  }
}
