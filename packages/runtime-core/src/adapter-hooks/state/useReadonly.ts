import { useMemo } from 'react';
import { Snapshot } from 'valtio/vanilla';
import { useProxySubscribe } from '../shared/hooks';
import { isProxy, isRef } from '../shared/proxy';
import { freezeObject } from '../shared/utils';
import { UnwrapRef, unwrapRef, WrapRef } from './useVRef';

export type ReadonlySnapshot<T> =
  T extends WrapRef<any> ? ReadonlyType<UnwrapRef<T>> : ReadonlyType<T>;

export type ReadonlyType<T> = Readonly<T> | Snapshot<T>;

/**
 * Creates a readonly snapshot of the given target object.
 *
 * If the target is not a reactive proxy, it deeply freezes the object to prevent mutations.
 * If the target is a reactive proxy, it returns a readonly version of the proxy.
 *
 * @see https://vureact-runtime.vercel.app/guide/hooks/readonly
 *
 * @example
 *
 * const stateProxy = useReactive({ a: 1 });
 * const read = useReadonly(stateProxy);
 * read.a; // Read-only, cannot be modified
 * stateProxy.a++; // Modify the source proxy, read.a is automatically synced and updated
 *
 * @param target - The object to make readonly.
 * @returns A readonly snapshot of the target object.
 */
export function useReadonly<T extends object>(target: T): ReadonlySnapshot<T> {
  if (!isProxy(target)) {
    // 非响应式对象则深度冻结
    return freezeObject(target) as any;
  }

  return createReadonly(target);
}

/**
 * Creates a shallow readonly proxy for the given target object.
 *
 * - If the target is not a reactive proxy, it returns a shallow frozen version of the object.
 * - If the target is a proxy, it wraps it in a shallow readonly proxy that prevents mutation and deletion,
 *   emitting warnings in non-production environments.
 * - The returned proxy is memoized to ensure stable references as long as the target does not change.
 * - The returned value is a readonly snapshot that updates when the target changes, ensuring React components
 *   re-render appropriately.
 *
 * @example
 *
 * const stateProxy = useReactive({ a: 1, b: { c: 2 } });
 * const read = useShallowReadonly(stateProxy);
 *
 * read.a++; // Read-only access, cannot be modified
 * read.b.c++; // Nested objects can be modified
 *
 * @param target - The object to be wrapped in a shallow readonly proxy.
 * @returns A readonly snapshot of the target object.
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
  return isRef(read)
    ? (unwrapRef(read as WrapRef<T>) as any) // 自动解包 ref
    : (read as any);
}
