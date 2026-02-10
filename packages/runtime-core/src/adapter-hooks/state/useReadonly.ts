import { useMemo, useSyncExternalStore } from 'react';
import { snapshot, Snapshot, subscribe } from 'valtio/vanilla';

export type ReadonlyState<T> = Readonly<Snapshot<T>>;

/**
 * Returns an immutable snapshot of the current state of a `proxy` object (based on Valtio).
 *
 * Features:
 * - Behaves similarly to Vue's `readonly`: returns an immutable snapshot for safely reading the state;
 * - The snapshot will be automatically updated as the original proxy changes subsequently.
 *
 * @example
 *
 * const stateProxy = useReactive({ a: 1 });
 * const read = useReadonly(stateProxy);
 * read.a; // Read-only, cannot be modified
 * stateProxy.a++; // Modify the source proxy, read.a is automatically synced and updated
 */
export function useReadonly<T extends object>(proxyObject: T): ReadonlyState<T> {
  return useSyncExternalStore(
    (callback) => subscribe(proxyObject, callback),
    () => snapshot(proxyObject),
  );
}

/**
 * Creates a shallow immutable snapshot where outer properties are read-only, while internal nested objects retain references to the original proxy.
 *
 * Features:
 * - Behaves similarly to Vue's `shallowReadonly`: prevents write/delete operations on first-level properties, but does not deeply freeze nested objects.
 *
 * @example
 *
 * const stateProxy = useReactive({ a: 1, b: { c: 2 } });
 * const read = useShallowReadonly(stateProxy);
 * read.a++; // Read-only access, cannot be modified
 * read.b.c++; // Nested objects can be modified
 */
export function useShallowReadonly<T extends object>(proxyObject: T): Readonly<T> {
  // 手动拦截对象，不进行递归代理
  const shallowProxy = new Proxy(proxyObject, {
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
  // 只要 proxyObject 引用没变，就复用同一个只读代理外壳
  // 确保 getSnapshot 返回的引用稳定性
  const state = useMemo(() => shallowProxy, [proxyObject]);

  // 这里的 getSnapshot 变成了缓存的 state
  // 当 proxyObject 内部发生变化触发 callback 时，React 会重新渲染
  // 虽然 state 引用没变，但组件会因为 subscribe 的触发而更新
  return useSyncExternalStore(
    (callback) => subscribe(proxyObject, callback),
    () => state,
  );
}
