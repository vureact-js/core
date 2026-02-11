import { klona } from 'klona';
import { useRef } from 'react';
import { proxy, ref } from 'valtio/vanilla';
import { PROXY_FLAG_KEY, PROXY_FLAG_VALUE, RAW_OBJ_KEY } from '../shared/consts';
import { useProxySubscribe } from '../shared/hooks';
import { isPrimitive, isProxy, setProxyMeta } from '../shared/utils';

/**
 * Wraps a plain object into reactive state (based on Valtio).
 *
 * Features:
 * - Behaves almost identically to Vue's `reactive`;
 * - Creates a deeply reactive object by default (all nested objects are reactive);
 * - A shallow reactive object that only listens to first-level property changes
 *   can be created via `useShallowReactive`.
 *
 * @example
 *
 * const state = useReactive({ count: 0, nested: { n: 1 } });
 * // Modifications will trigger component re-rendering
 * state.count++;
 * state.nested.n = 2;
 */
export function useReactive<T extends object>(target: T): T {
  return createReactive(target);
}

/**
 * Only listens to the assignment/replacement of first-level properties.
 * Nested objects are wrapped with Valtio's `ref` to avoid deep proxying.
 *
 * Features:
 * - Behaves similarly to Vue's `shallowReactive`;
 * - Modifying internal properties of nested objects will not trigger re-rendering of the outer layer,
 *   but replacing the entire nested object will trigger it.
 *
 * @example
 *
 * const state = useShallowReactive({ a: { x: 1 } });
 * // Will not cause component re-rendering
 * state.a.x++
 * // Direct replacement will trigger it
 * state.a = { x: 2 }
 */
export function useShallowReactive<T extends object>(target: T): T {
  return createReactive(target, true);
}

function createReactive<T extends object>(target: T, shallow = false): T {
  if (isProxy(target)) {
    // 返回已代理过的对象
    return target;
  }

  let baseObject: Record<string, any> = target;

  if (shallow) {
    // 手动浅拷贝对象
    baseObject = { ...target };

    Object.keys(baseObject).forEach((key) => {
      const val = baseObject[key];
      if (!isPrimitive(val)) {
        // 只监听第一层的属性赋值
        baseObject[key] = ref(val);
      }
    });
  }

  return createProxy(baseObject as T, {
    clone: !shallow,
    flag: PROXY_FLAG_VALUE.reactive,
    originalTarget: target,
  });
}

interface CreateProxyOptions {
  clone?: boolean;
  flag: PROXY_FLAG_VALUE;
  originalTarget?: object;
}

/**
 * @private
 * Creates and caches a Valtio `proxy` within the hook, and returns the subscribed proxy object via `useProxy`.
 *
 * Notes:
 * - Uses `useRef` internally to cache the proxy instance, ensuring a singleton data source within the component;
 * - When `options.clone` is true, performs a deep clone on the passed target to isolate external references (behaves similarly to Vue).
 */
export function createProxy<T extends object>(target: T, options?: CreateProxyOptions): T {
  const proxyRef = useRef<T>(null);

  const shouldClone = options?.clone ?? true;

  // 确保数据源单例
  if (!proxyRef.current) {
    const baseObject = shouldClone ? klona(target) : target;
    const proxyObject = proxy(baseObject);

    // 注入元数据标识
    setProxyMeta(proxyObject, {
      [PROXY_FLAG_KEY]: options?.flag,
      [RAW_OBJ_KEY]: options?.originalTarget ?? target,
    });

    proxyRef.current = proxyObject;
  }

  useProxySubscribe(proxyRef.current!);

  return proxyRef.current!;
}
