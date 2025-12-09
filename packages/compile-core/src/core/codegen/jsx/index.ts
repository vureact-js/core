import { ReactIRDescriptor } from '@core/transform';
import { buildElement } from './builders/element-builder';
import { JSXChild } from './types';

export function generateJsx(ir: ReactIRDescriptor): JSXChild | null {
  const templateBlock = ir.template;

  if (!templateBlock?.children.length) {
    return null;
  }

  // jsx 的根元素有且只能有一个
  // 转换阶段已经对多根节点处理成一个 fragment 包裹
  const [root] = templateBlock.children;

  return buildElement(root!);
}
