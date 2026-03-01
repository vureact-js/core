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

  // 解析 <slot> 标签的属性，获取插槽名称和作用域参数
  const slotContext = resolveSlotProps(node, ctx);

  // 将插槽信息注册到模板数据中，供后续使用
  templateData.slots[slotContext.name] = slotContext;

  // 将 <slot> 节点转换为插值表达式节点 IR
  const interpolationIR = resolveSlotNode(parentIR, node, nodeIR, slotContext, ctx);

  // 如果当前节点没有父节点 IR，则将插值节点直接添加到子节点 IR 列表中
  if (!parentIR) {
    childrenIR.push(interpolationIR);
  }
}

function resolveSlotProps(node: VueElementNode, ctx: ICompilationContext): SlotNodesContext {
  // 初始化插槽上下文对象，包含插槽名称、是否为作用域插槽、作用域参数列表
  const result: SlotNodesContext = {
    name: 'children', // 默认插槽名为'children'
    isScope: false, // 默认非作用域插槽
    props: [], // 作用域参数列表
  };

  const { source, filename } = ctx;

  // 添加作用域插槽参数的辅助函数
  const addSlotProp = (key: string, value: any) => {
    // 将参数值转换为TypeScript类型
    const tsType = stringValueToTSType(ctx, value, true);

    // 标记为作用域插槽
    result.isScope = true;
    result.props.push({
      prop: key,
      value,
      tsType,
    });
  };

  // 遍历 slot 节点的所有属性
  for (const prop of node.props) {
    // 处理普通属性（非指令）
    if (prop.type === NodeTypes.ATTRIBUTE) {
      const attr = prop.name; // 属性名
      const value = prop.value?.content.trim(); // 属性值

      if (attr === 'name' && value) {
        // 如果是name属性，转换为驼峰命名作为插槽名
        result.name = camelCase(value);
      } else {
        // 其他属性作为作用域插槽参数，值用字符串包裹
        addSlotProp(attr, `'${value}'`);
      }

      continue;
    }

    // 处理指令（如v-bind）
    if (prop.type === NodeTypes.DIRECTIVE) {
      const arg = prop.arg as SimpleExpressionNode; // 指令参数
      const exp = prop.exp as SimpleExpressionNode; // 指令表达式

      // 检查是否使用了不支持的Vue $变量
      warnUnsupportedVueDollarVar(ctx, prop);

      // 警告动态插槽名可能带来的问题
      if (!arg.isStatic) {
        logger.warn('Avoid using dynamic slot names, as they may lead to unexpected behavior.', {
          source,
          file: filename,
          loc: arg.loc!,
        });
      }

      const key = arg.content; // 参数名
      const value = exp.content.trim(); // 表达式内容

      if (key === 'name') {
        // 如果是name指令，转换为驼峰命名作为插槽名
        result.name = camelCase(value);
      } else {
        // 其他指令作为作用域插槽参数
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
  // 获取插槽的默认内容（fallback）子节点
  const fallback = node.children;

  // 标记默认内容是否已处理为简单文本
  let fallbackResolved = false;

  // 基础插槽表达式：从 props 字段访问对应插槽
  let expression = `${ctx.propField}.${slotContext.name}`;

  // 处理作用域插槽：如果插槽有作用域参数，则生成函数调用表达式
  if (slotContext.isScope) {
    // 将作用域参数转换为对象字面量字符串，如 `'prop1': value1, 'prop2': value2`
    const stringifiedKeyValues = slotContext.props
      .map((slotProp) => `'${slotProp.prop}': ${slotProp.value}`)
      .join(', ');

    // 在插槽表达式后添加函数调用部分，如 `?.({ 'prop1': value1, 'prop2': value2 })`
    expression += `?.({ ${stringifiedKeyValues} })`;
  }

  // 处理默认内容：如果默认内容只有一个文本节点，则直接转换为字符串备用
  if (fallback.length === 1) {
    const child = fallback[0]!;
    if (child.type === NodeTypes.TEXT) {
      fallbackResolved = true; // 标记已处理为文本
      // 在表达式后添加空值合并运算符和文本内容，如 `?? '默认文本'`
      expression += ` ?? ${JSON.stringify(child.content.trim())}`;
    }
  }

  // 创建插值节点 IR，包含生成的表达式
  const interpolationIR = createInterpolationNodeIR(expression);

  // 如果默认内容不是单个文本节点且存在子节点，则需进一步处理
  if (!fallbackResolved && fallback.length > 0) {
    // 默认内容不是单个文本节点时，先把 fallback 子节点转换成模板 IR。
    const fallbackIR: TemplateChildNodeIR[] = [];
    // 使用独立 children 容器收集，避免把 fallback 混入当前父节点 children。
    resolveChildNodes(node, nodeIR, ctx, null, fallbackIR);
    // 把 fallback IR 挂到插值节点 meta，留给 codegen 阶段拼接 `?? <fallback/>`。
    interpolationIR.meta = {
      slotWithDefault: fallbackIR,
    };
  }

  // 如果有父节点 IR，将插值节点添加到父节点的子节点列表中
  if (parentIR) {
    parentIR.children.push(interpolationIR);
  }

  // 将插槽表达式解析为 Babel AST，供 codegen 直接复用。
  interpolationIR.babelExp = resolveStringExpr(expression, ctx);

  return interpolationIR;
}
