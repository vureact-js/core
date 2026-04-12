import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { resolveSlotType } from './type-resolver';
import { collectLocalTypeDeclarations, recordReactNode } from './utils';

/**
 * 解析 `defineSlots` 的 TypeScript 类型参数并把解析结果记录到编译上下文。
 */
export function resolveDefineSlotsIface(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
) {
  const { node } = path;
  
  // 获取 defineSlots 的类型参数（泛型参数）
  const tsParams = node.typeParameters?.params;

  // 如果没有类型参数，直接返回
  if (!tsParams?.length) return;

  // 从编译上下文中获取用于存储 slot 类型定义的容器
  const {
    propsTSIface: { slotTypes },
  } = ctx.scriptData;

  // 收集当前作用域内的局部类型声明，用于解析类型引用
  const localTypeDeclarations = collectLocalTypeDeclarations(path);

  // 标记是否需要记录 ReactNode 类型（用于后续的运行时导入）
  let shouldRecordReactNode = false;

  // 遍历所有类型参数，逐个解析 slot 类型
  for (const tsType of tsParams) {
    // 解析单个 slot 类型，返回解析后的类型定义和是否需要 ReactNode 的标记
    const { type: resolved, shouldRecordReactNode: needsReactNode } = resolveSlotType(tsType, {
      localTypeDeclarations,
      visitedTypeNames: new Set<string>(),
    });

    // 如果解析成功，将类型定义存入上下文，并更新 ReactNode 标记
    if (resolved) {
      slotTypes.push(resolved);
      shouldRecordReactNode = shouldRecordReactNode || needsReactNode;
    }
  }

  // 如果任何 slot 类型需要 ReactNode，则在上下文中记录该依赖
  if (shouldRecordReactNode) {
    recordReactNode(ctx);
  }
}
