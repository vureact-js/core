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
 * @returns TemplateBlockIR 或 null (如果 root 不存在)
 */
export function transformTemplate(root?: VueRootNode): TemplateBlockIR | null {
  if (!root) return null;

  const children: TemplateChildNodeIR[] = [];

  // 注意：根节点转换时没有父级 ElementNode (Parent)，因此第二个参数传入 null/undefined。
  transformElements(root, null as any, children);

  return {
    children,
  };
}
