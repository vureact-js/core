import * as t from '@babel/types';
import { ICompilationContext, SlotNodesContext } from '@compiler/context/types';
import { COMP_PROPS_NAME } from '@consts/other';
import { logger } from '@shared/logger';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { stringValueToTSType } from '@src/core/transform/sfc/script/shared/babel-utils';
import { createInterpolationNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { warnUnsupportedVueDollarVar } from '@src/core/transform/sfc/template/shared/warning-utils';
import { NodeTypes, SimpleExpressionNode, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from './resolve-element-node';

export function resolveSlotOutletNode(
  node: VueElementNode,
  _ir: TemplateBlockIR,
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  childrenIR: TemplateChildNodeIR[],
) {
  const { templateData } = ctx;
  const slotContext = resolveSlotProps(node, ctx);

  templateData.slots[slotContext.name] = slotContext;

  const interpolationIR = resolveSlotReplacement(parentIR, slotContext);

  if (!parentIR) {
    childrenIR.push(interpolationIR);
  }
}

function resolveSlotProps(node: VueElementNode, ctx: ICompilationContext): SlotNodesContext {
  const result: SlotNodesContext = {
    name: 'children',
    isScope: false,
    props: [],
  };

  const { source, filename } = ctx;

  const addSlotProp = (key: string, value: any) => {
    const tsType = stringValueToTSType(ctx, value, true);
    result.isScope = true;
    result.props.push({
      prop: key,
      value,
      tsType,
    });
  };

  for (const prop of node.props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      const attr = prop.name;
      const value = prop.value?.content.trim();

      if (attr === 'name' && value) {
        result.name = value;
      } else {
        addSlotProp(attr, `'${value}'`);
      }

      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      const arg = prop.arg as SimpleExpressionNode;
      const exp = prop.exp as SimpleExpressionNode;

      warnUnsupportedVueDollarVar(ctx, prop);

      if (!arg.isStatic) {
        logger.warn('Dynamic slot prop detected. This usage may not be fully supported.', {
          source,
          file: filename,
          loc: arg.loc!,
        });
      }

      const key = arg.content;
      const value = exp.content.trim();

      if (key === 'name') {
        result.name = value;
      } else {
        addSlotProp(key, value);
      }
    }
  }

  return result;
}

function resolveSlotReplacement(
  parentIR: ElementNodeIR | null,
  slotContext: SlotNodesContext,
): TemplateChildNodeIR {
  let expression = `${COMP_PROPS_NAME}.${slotContext.name}`;

  if (slotContext.isScope) {
    const stringifiedKeyValues = Object.entries(slotContext.props)
      .map(([key, value]) => `'${key}': ${value}`)
      .join(', ');

    expression += `?.({ ${stringifiedKeyValues} })`;
  }

  const interpolationIR = createInterpolationNodeIR(expression);
  interpolationIR.babelExp = t.identifier(expression);

  if (parentIR) {
    parentIR.children.push(interpolationIR);
  }

  return interpolationIR;
}
