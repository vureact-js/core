import { useMemo } from 'react';
import { Snapshot } from 'valtio/vanilla';
import { useProxySubscribe } from '../shared/hooks';
import { freezeObject, isProxy, isRefState } from '../shared/utils';
import { UnwrapRef, unwrapRef, WrapRef } from './useRefState';

export type ReadonlySnapshot<T> =
  T extends WrapRef<any> ? ReadonlyType<UnwrapRef<T>> : ReadonlyType<T>;

export type ReadonlyType<T> = Readonly<T> | Snapshot<T>;

/**
 * Returns an immutable snapshot of the current state of a proxy or plain object (based on Valtio).
 *
 * Features:
 * - Behaves similarly to Vue's `readonly`: returns an immutable snapshot for safely reading the state;
 * - The snapshot will be automatically updated as the original proxy changes subsequently.
 * - Automatically unwraps the `value` property of `RefState`.
 *
 * @example
 *
 * const stateProxy = useReactive({ a: 1 });
 * const read = useReadonly(stateProxy);
 * read.a; // Read-only, cannot be modified
 * stateProxy.a++; // Modify the source proxy, read.a is automatically synced and updated
 */
export function useReadonly<T extends object>(target: T): ReadonlySnapshot<T> {
  if (!isProxy(target)) {
    // 非响应式对象则深度冻结
    return freezeObject(target) as any;
  }

  return createReadonly(target);
}

/**
 * Creates a shallow immutable snapshot where outer properties are read-only, while internal nested objects retain references to the original proxy.
 *
 * Features:
 * - Behaves similarly to Vue's `shallowReadonly`: prevents write/delete operations on first-level properties, but does not deeply freeze nested objects.
 * - Automatically unwraps the `value` property of `RefState`.
 *
 * @example
 *
 * const stateProxy = useReactive({ a: 1, b: { c: 2 } });
 * const read = useShallowReadonly(stateProxy);
 * read.a++; // Read-only access, cannot be modified
 * read.b.c++; // Nested objects can be modified
 */
export function useShallowReadonly<T extends object>(target: T): ReadonlySnapshot<T> {
  if (!isProxy(target)) {
    // 非响应式对象则浅冻结
    return freezeObject(target, { deep: false }) as any;
  }

  // 手动拦截对象，不进行递归代理
  const shallowProxy = new Proxy(target, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set() {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot modify readonly object');
      }
      return false;
    },
    deleteProperty() {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot delete property from readonly object');
      }
      return false;
    },
  });

  // 缓存 shallowReadonly 代理实例
  // 只要 target 引用没变，就复用同一个只读代理外壳
  // 确保 getSnapshot 返回的引用稳定性
  const state = useMemo(() => shallowProxy, [target]);

  // 这里的 getSnapshot 变成了缓存的 state
  // 当 target 内部发生变化触发 callback 时，React 会重新渲染
  // 虽然 state 引用没变，但组件会因为 subscribe 的触发而更新
  return createReadonly(target, () => state);
}

function createReadonly<T extends object>(target: T, getSnapshot?: () => T): ReadonlySnapshot<T> {
  const read = useProxySubscribe(target, getSnapshot);
  return isRefState(read)
    ? (unwrapRef(read) as any) // 自动解包 ref
    : (read as any);
}
