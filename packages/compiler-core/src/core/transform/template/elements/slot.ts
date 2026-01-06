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
import { __props } from '../../const';
import { resolveTemplateExp } from '../shared/resolve-str-exp';
import { warnVueDollarVar } from '../shared/unsupported-warn';
import { ElementNodeIR } from './element';
import { createInterpolationNodeIR } from './node-creators';

export function transformSlot(node: VueElementNode, parentIR: ElementNodeIR) {
  const slotIR = resolveSlotProps(node.props);
  const { templateSlots } = compileContext.context;

  templateSlots[slotIR.name] = slotIR.props;

  replaceSlotNode(parentIR, slotIR);
}

type SlotIR = {
  name: string;
  props: Record<string, any>;
};

function resolveSlotProps(props: (AttributeNode | DirectiveNode)[]): SlotIR {
  const ir: SlotIR = {
    name: '',
    props: {},
  };

  props.forEach((p) => {
    if (p.type === NodeTypes.ATTRIBUTE) {
      const key = p.name;
      const value = p.value?.content.trim();

      if (key === 'name' && value) {
        ir.name = value;
        return;
      }

      ir.props[key] = `'${value}'`;
      return;
    }

    if (p.type === NodeTypes.DIRECTIVE) {
      const arg = p.arg as SimpleExpressionNode;
      const exp = p.exp as SimpleExpressionNode;

      warnVueDollarVar(p);

      if (!arg.isStatic) {
        warnDynamicSlotProp(arg.loc);
      }

      if (arg.content === 'name') {
        ir.name = exp.content.trim();
        return;
      }

      ir.props[arg.content] = exp.content.toString();
    }
  });

  // 默认插槽 'default' 相当于 react 的 props.children
  if (!ir.name || ir.name === 'default') {
    ir.name = 'children';
  }

  return ir;
}

function replaceSlotNode(parentIR: ElementNodeIR, slotIR: SlotIR) {
  let interpContent = `${__props}.${slotIR.name}`;

  const isScoped = Object.keys(slotIR.props).length !== 0;

  if (isScoped) {
    const strKeyVal = Object.entries(slotIR.props)
      .map(([k, v]) => `'${k}': ${v}`)
      .join(', ');
    // 转为调用表达式
    interpContent += `?.({ ${strKeyVal} })`;
  }

  const interp = createInterpolationNodeIR(interpContent);

  interp.babelExp = resolveTemplateExp(interpContent);
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
