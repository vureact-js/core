import { parseTemplateExp } from '@src/shared/babel-utils';
import { compileContext } from '@src/shared/compile-context';
import { logger } from '@src/shared/logger';
import {
  AttributeNode,
  DirectiveNode,
  NodeTypes,
  SimpleExpressionNode,
  SourceLocation,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { ElementNodeIR } from './element';
import { createInterpolationNodeIR } from './node-creators';

export function transformSlot(node: VueElementNode, parentIR: ElementNodeIR) {
  const { defineSlots } = compileContext.context;
  const slotDesc = resolveSlotProps(node.props);

  defineSlots.push(slotDesc);
  replaceSlotNode(parentIR, slotDesc);
}

type SlotDesc = {
  name: string;
  props: Record<string, any>;
};

function resolveSlotProps(props: (AttributeNode | DirectiveNode)[]): SlotDesc {
  const desc: SlotDesc = {
    name: '',
    props: {},
  };

  props.forEach((p) => {
    if (p.type === NodeTypes.ATTRIBUTE) {
      const key = p.name;
      const value = p.value?.content.trim();

      if (key === 'name' && value) {
        desc.name = value;
        return;
      }

      desc.props[key] = `'${value}'`;
      return;
    }

    if (p.type === NodeTypes.DIRECTIVE) {
      const arg = p.arg as SimpleExpressionNode;
      const exp = p.exp as SimpleExpressionNode;

      if (!arg.isStatic) {
        warnDynamicSlotProp(arg.loc);
      }

      if (arg.content === 'name') {
        desc.name = exp.content.trim();
        return;
      }

      desc.props[arg.content] = exp.content.toString();
    }
  });

  // 默认插槽 'default' 相当于 react 的 props.children
  if (!desc.name || desc.name === 'default') {
    desc.name = 'children';
  }

  return desc;
}

function replaceSlotNode(parentIR: ElementNodeIR, slotDesc: SlotDesc) {
  let exp = `_props?.${slotDesc.name}`;

  const isScoped = Object.keys(slotDesc.props).length !== 0;

  if (isScoped) {
    const strKeyVal = Object.entries(slotDesc.props)
      .map(([k, v]) => `'${k}': ${v}`)
      .join(', ');

    exp += `({ ${strKeyVal} })`;
  }

  const interp = createInterpolationNodeIR(exp);

  interp.babelExp = parseTemplateExp(exp);
  parentIR.children.push(interp);
}

function warnDynamicSlotProp(loc: SourceLocation) {
  const { source, filename } = compileContext.context;
  logger.warn('Dynamic slot prop detected. This usage may not be fully supported.', {
    source,
    file: filename,
    loc,
  });
}
