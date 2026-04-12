import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { buildSlotPropSignature, createSlotScopeParam } from './slot-builder';
import { recordReactNode } from './utils';

/**
 * 解析模板中声明的插槽（匿名或具名）的 TypeScript 类型信息。
 * 如果已经通过 `defineSlots` 指定了类型则跳过。
 * 否则根据模板 `slots` 信息构建对应的 TS 类型并记录到上下文。
 */
export function resolveTemplateSlotIface(ctx: ICompilationContext) {
  if (ctx.inputType !== 'sfc') return;

  const {
    propsTSIface: { slotTypes },
  } = ctx.scriptData;

  // 如果已使用 defineSlots，则无需再推导 ts 类型
  if (slotTypes.length) return;

  const { slots } = ctx.templateData;
  const tsMembers: t.TSPropertySignature[] = [];

  // 遍历模板中声明的所有插槽
  for (const name in slots) {
    const slotObj = slots[name];

    // 跳过无效的插槽对象
    if (!slotObj) continue;

    // 如果插槽是作用域插槽，则创建对应的参数类型节点，否则参数数组为空
    const params = slotObj.isScope ? [createSlotScopeParam(slotObj.props, ctx)] : [];

    // 构建插槽属性的类型签名节点
    const tsNode = buildSlotPropSignature(slotObj.name, params, true);

    // 将构建好的类型签名节点添加到成员数组中
    tsMembers.push(tsNode);
  }

  // 如果存在插槽类型成员，则进行记录
  if (tsMembers.length) {
    // 记录 React 节点类型引用，确保类型定义可用
    recordReactNode(ctx);

    // 将类型字面量（包含所有插槽属性签名）推入插槽类型数组
    slotTypes.push(t.tsTypeLiteral(tsMembers));
  }
}
