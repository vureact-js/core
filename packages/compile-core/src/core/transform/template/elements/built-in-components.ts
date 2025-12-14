import { RV3_Components } from '@consts/runtimeModules';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { SourceLocation } from '@vue/compiler-core';
import { PropsIR } from '../props';
import { createPropsIR } from '../props/utils';
import { preParseProp } from '../shared/pre-parse/prop';
import { ElementNodeIR } from './node';

export function markBuiltinComponent(nodeIR: ElementNodeIR) {
  if (nodeIR.isComponent && nodeIR.tag in RV3_Components) {
    nodeIR.isBuiltIn = true;
  }
}

export function handleBuiltinComponent(
  nodeIR: ElementNodeIR,
  parentIR: ElementNodeIR,
  loc: SourceLocation,
) {
  if (!parentIR?.isBuiltIn) return;

  const { show, condition } = nodeIR.meta;
  const isTransition = parentIR.tag === 'Transition';

  // handle transition component
  if (isTransition) {
    const { source, filename } = compileContext.context;
    const loggerOpts = {
      source,
      loc,
      file: filename,
    };

    if (parentIR.children.length > 1) {
      logger.error('<Transition> expected exactly one node.', loggerOpts);
      return;
    }

    if (!show && !condition?.if) {
      const seekParent = parentIR.props.some((p) => p.name === 'if' || p.name === 'show');
      if (!seekParent) {
        logger.warn('Missing v-show or v-if; <Transition> requires one of them.', loggerOpts);
      }
      return;
    }

    if (condition?.next) {
      logger.error(
        'When using v-if to switch between multiple nodes, <Transition> effects will not work.',
        loggerOpts,
      );
      return;
    }

    let propIR = {} as PropsIR;

    if (condition?.if) {
      propIR = createPropsIR('v-if', 'if', condition.value);
      nodeIR.meta.condition = undefined;
    } else if (show?.isShow) {
      propIR = createPropsIR('v-show', 'show', show.value);
      propIR.value.babelExp = show.babelExp;

      const idx = nodeIR.props.findIndex((p) => p.rawName === 'v-show');
      if (idx > -1) nodeIR.props.splice(idx, 1);
      nodeIR.meta.show = undefined;
    }

    preParseProp(propIR);
    parentIR.props.push(propIR);

    return;
  }
}
