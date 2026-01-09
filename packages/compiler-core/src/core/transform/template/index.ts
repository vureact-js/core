import { ICompilationContext } from '@compiler/context/types';
import { RootNode as VueRootNode } from '@vue/compiler-core';
import { transformElements } from './elements';
import { ElementNodeIR } from './elements/element';
import { BaseSimpleNodeIR, FragmentNodeIR } from './elements/node-creators';

export interface TemplateBlockIR {
  children: TemplateChildNodeIR[];
}

export type TemplateChildNodeIR = ElementNodeIR | BaseSimpleNodeIR | FragmentNodeIR;

/**
 * 将 Vue 的 Template AST 转换为 React 中间表示 (IR)
 * @param root - Vue 编译器的 RootNode AST
 * @returns TemplateBlockIR
 */
export function transformTemplate(root: VueRootNode, ctx: ICompilationContext): TemplateBlockIR {
  const children: TemplateChildNodeIR[] = [];

  // 注意：根节点转换时没有父级 ElementNode (Parent)，因此第二个参数传入 null/undefined。
  transformElements(ctx, root, null as any, children);

  return {
    children,
  };
}
