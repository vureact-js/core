import { useMemo } from 'react';
import { useProxySubscribe } from '../shared/hooks';
import { isProxy } from '../shared/proxy';
import { toPropertyRefState, ToRefValueState } from './useToRefState';

export type ToRefStates<T> = {
  [K in keyof T]: ToRefValueState<T[K]>;
};

/**
 * Creates a stable object or array of refs for each property of a reactive object,
 * allowing individual property reactivity and two-way binding.
 *
 * This hook expects a reactive (Proxy) object as input. If a non-reactive object is provided
 * in development mode, a warning will be logged. The returned refs object maintains a stable
 * reference across renders and ensures that changes to the original object's properties
 * trigger component updates.
 *
 * For arrays, only numeric indices are converted to refs; non-index properties like 'length' are ignored.
 *
 * @example
 * const state = reactive({ count: 0, name: 'foo' });
 * const refs = useToRefStates(state);
 * // refs.count is a ref linked to state.count
 *
 *
 * @param object - The reactive object whose properties will be converted to refs.
 * @returns An object or array of refs corresponding to each property of the input object.
 *
 */
export function useToRefStates<T extends object>(object: T): ToRefStates<T> {
  if (process.env.NODE_ENV !== 'production' && !isProxy(object)) {
    console.warn('useToRefStates() expects a reactive object.');
  }

  // 订阅变更：确保当原始 object 的属性发生变化时，当前组件会重新渲染
  // 因为返回的 refs 对象本身不是 Proxy，我们需要手动订阅源对象的变更
  if (isProxy(object)) {
    useProxySubscribe(object);
  }

  // 保证返回的 refs 对象引用稳定
  return useMemo(() => {
    const isArray = Array.isArray(object);
    const refs = (isArray ? new Array(object.length) : {}) as any;

    // 使用 Object.keys 替代 for...in，对 Proxy 更友好
    const keys = Object.keys(object) as (keyof T)[];

    for (const key of keys) {
      // 过滤数组的非索引属性（如 length）
      if (isArray && key === 'length') continue;

      // 将每个属性转换为一个具有 getter/setter 的 Ref 对象
      refs[key] = toPropertyRefState(object, key);
    }

    return refs as ToRefStates<T>;
  }, [object]);
}
