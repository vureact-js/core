import { ICompilationContext, SlotNodesContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { stringValueToTSType } from '@src/core/transform/sfc/script/shared/babel-utils';
import { TemplateBlockIR, TemplateChildNodeIR } from '@src/core/transform/sfc/template';
import { createInterpolationNodeIR } from '@src/core/transform/sfc/template/shared/node-ir-utils';
import { resolveStringExpr } from '@src/core/transform/sfc/template/shared/resolve-string-expression';
import { warnUnsupportedVueDollarVar } from '@src/core/transform/sfc/template/shared/warning-utils';
import { camelCase } from '@utils/camelCase';
import { NodeTypes, SimpleExpressionNode, ElementNode as VueElementNode } from '@vue/compiler-core';
import { ElementNodeIR } from './resolve-element-node';
import { resolveChildNodes } from './resolve-template-children';

export function resolveSlotOutletNode(
  node: VueElementNode,
  nodeIR: TemplateBlockIR,
  ctx: ICompilationContext,
  parentIR: ElementNodeIR | null,
  childrenIR: TemplateChildNodeIR[],
) {
  const { templateData } = ctx;
  const slotContext = resolveSlotProps(node, ctx);

  templateData.slots[slotContext.name] = slotContext;

  const interpolationIR = resolveSlotNode(parentIR, node, nodeIR, slotContext, ctx);

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
        result.name = camelCase(value);
      } else {
        addSlotProp(attr, `'${value}'`);
      }

      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      warnUnsupportedVueDollarVar(ctx, prop);

      // fix: https://github.com/vureact-js/core/issues/44
      // `slot` outlet 上允许出现 `v-if / v-else / v-else-if` 这类结构指令。
      // 它们没有 arg / exp，不应被当成作用域参数继续解析。
      if (!prop.arg) {
        continue;
      }

      const arg = prop.arg as SimpleExpressionNode;
      const exp = prop.exp as SimpleExpressionNode | undefined;

      if (!arg.isStatic) {
        logger.warn('Avoid using dynamic slot names, as they may lead to unexpected behavior.', {
          source,
          file: filename,
          loc: arg.loc!,
        });
      }

      const key = arg.content;
      const value = exp?.content?.trim() || 'undefined';

      if (key === 'name') {
        result.name = camelCase(value);
      } else {
        addSlotProp(key, value);
      }
    }
  }

  return result;
}

function resolveSlotNode(
  parentIR: ElementNodeIR | null,
  node: VueElementNode,
  nodeIR: TemplateBlockIR,
  slotContext: SlotNodesContext,
  ctx: ICompilationContext,
): TemplateChildNodeIR {
  const fallback = node.children;
  let fallbackResolved = false;
  let expression = `${ctx.propField}.${slotContext.name}`;

  if (slotContext.isScope) {
    const stringifiedKeyValues = slotContext.props
      .map((slotProp) => `'${slotProp.prop}': ${slotProp.value}`)
      .join(', ');

    expression += `?.({ ${stringifiedKeyValues} })`;
  }

  if (fallback.length === 1) {
    const child = fallback[0]!;
    if (child.type === NodeTypes.TEXT) {
      fallbackResolved = true;
      expression += ` ?? ${JSON.stringify(child.content.trim())}`;
    }
  }

  const interpolationIR = createInterpolationNodeIR(expression);

  if (!fallbackResolved && fallback.length > 0) {
    const fallbackIR: TemplateChildNodeIR[] = [];
    resolveChildNodes(node, nodeIR, ctx, null, fallbackIR);
    interpolationIR.meta = {
      slotWithDefault: fallbackIR,
    };
  }

  if (parentIR) {
    parentIR.children.push(interpolationIR);
  }

  interpolationIR.babelExp = resolveStringExpr(expression, ctx);

  return interpolationIR;
}
