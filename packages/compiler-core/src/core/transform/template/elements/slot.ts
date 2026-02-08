import * as t from '@babel/types';
import { ICompilationContext, SlotNodesContext } from '@compiler/context/types';
import { COMP_PROPS_NAME } from '@src/consts/other';
import { logger } from '@src/shared/logger';
import {
  AttributeNode,
  DirectiveNode,
  NodeTypes,
  SimpleExpressionNode,
  ElementNode as VueElementNode,
} from '@vue/compiler-core';
import { stringValueToTSType } from '../../script/shared/babel-utils';
import { warnVueDollarVar } from '../shared/unsupported-warn';
import { ElementNodeIR } from './element';
import { createInterpolationNodeIR } from './node-creators';

export function transformSlot(
  ctx: ICompilationContext,
  node: VueElementNode,
  parentIR: ElementNodeIR,
) {
  const { templateData } = ctx;
  const slotCtx = resolveSlotProps(ctx, node.props);

  templateData.slots[slotCtx.name] = slotCtx;
  replaceSlotNode(parentIR, slotCtx);
}

function resolveSlotProps(
  ctx: ICompilationContext,
  props: (AttributeNode | DirectiveNode)[],
): SlotNodesContext {
  const result: SlotNodesContext = {
    // 默认插槽 'default' 相当于 react 的 'children'
    name: 'children',
    isScope: false,
    props: [],
  };

  const { source, filename } = ctx;

  const setSlotProps = (key: string, value: any) => {
    const tsType = stringValueToTSType(ctx, value, true);
    result.isScope = true;
    result.props.push({
      prop: key,
      value,
      tsType,
    });
  };

  for (const prop of props) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      const attr = prop.name;
      const value = prop.value?.content.trim();

      // named slot
      if (attr === 'name' && value) {
        result.name = value;
      } else {
        setSlotProps(attr, `'${value}'`);
      }

      continue;
    }

    if (prop.type === NodeTypes.DIRECTIVE) {
      const arg = prop.arg as SimpleExpressionNode;
      const exp = prop.exp as SimpleExpressionNode;

      warnVueDollarVar(ctx, prop);

      // 不允许使用动态属性名
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
        setSlotProps(key, value);
      }
    }
  }

  return result;
}

function replaceSlotNode(parentIR: ElementNodeIR, slotCtx: SlotNodesContext) {
  let expr = `${COMP_PROPS_NAME}.${slotCtx.name}`;

  // 处理作用域插槽，转变为 $$props.xxx?.()
  if (slotCtx.isScope) {
    const strKeyVal = Object.entries(slotCtx.props)
      .map(([k, v]) => `'${k}': ${v}`)
      .join(', ');

    // 转为调用表达式
    expr += `?.({ ${strKeyVal} })`;
  }

  const interp = createInterpolationNodeIR(expr);

  // 直接转换成简单的标识符表达式
  interp.babelExp = t.identifier(expr);

  parentIR.children.push(interp);
}
