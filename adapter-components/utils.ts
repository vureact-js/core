/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, isValidElement, ReactElement } from 'react';

/**
 * 判断传入的参数是 React 组件本身 (函数/类) 还是 React 元素 (JSX)
 */
export function getReactType(param: any): 'component' | 'element' | 'text' | 'other' {
  if (typeof param === 'string') {
    return 'text';
  }
  // --- 1. 判断是否为 React 元素 (JSX) ---
  // 所有 React 元素都会有一个特殊的 Symbol 属性来标记它们
  if (isValidElement(param)) {
    return 'element';
  }
  // --- 2. 判断是否为 React 组件 (函数或类) ---
  // 组件本质上是函数或类，并且必须以大写字母开头（虽然代码判断不要求）
  if (typeof param === 'function' || param?.prototype?.isReactComponent) {
    // 也可以检查 param.prototype.isReactComponent 来判断是否为类组件，
    // 但对于函数组件，typeof function 即可
    return 'component';
  }

  return 'other';
}

export function getComponentName(el: ReactElement): string | null {
  const type = el.type as FunctionComponent;
  return type.displayName || type.name || null;
}
