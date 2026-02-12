import { klona } from 'klona';
import { useRef } from 'react';
import { getVersion, proxy } from 'valtio/vanilla';
import { IS_REACTIVE_PROXY, IS_REF_PROXY, RAW_TARGET, VALTIO_PROXY_TARGET } from './consts';
import { useProxySubscribe } from './hooks';
import { isPrimitive } from './utils';

interface ProxyOptions {
  clone?: boolean;
  meta: Record<string, any>;
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
export function createProxy<T extends object>(target: T, options?: ProxyOptions): T {
  const proxyRef = useRef<T>(null);

  // 这个函数不会修改数据，只会返回一个能“识别”元数据的 Proxy
  const createDeepInterceptor = (valtioProxy: T, raw: T) => {
    return new Proxy(valtioProxy, {
      get(target, prop, receiver) {
        // 在外壳 proxy 上暴露内部 Valtio proxy 指针
        if (prop === VALTIO_PROXY_TARGET) return target;
        if (prop === RAW_TARGET) return raw;

        trackProxyAccess(target);

        const value = Reflect.get(target, prop, receiver);

        // 只有当访问的是对象，且它是 Valtio 产生的子 Proxy 时，才进行懒包装
        if (!isPrimitive(value) && isProxy(value)) {
          // 由于 raw 是和 valtioProxy 结构一一对应的
          // 这里的 raw[prop] 就是对应的原始层级数据
          return createDeepInterceptor(value as T, raw?.[prop as keyof T] as T);
        }

        return value;
      },
    });
  };

  // 确保数据源单例
  if (!proxyRef.current) {
    const shouldClone = options?.clone ?? true;
    const baseTarget = shouldClone ? klona(target) : target;
    const originalTarget = (options?.originalTarget ?? baseTarget) as T;
    const valtioProxy = proxy(baseTarget);

    // 注入元数据
    if (options?.meta) setProxyMeta(valtioProxy, options.meta);

    proxyRef.current = createDeepInterceptor(valtioProxy, originalTarget);
  }

  useProxySubscribe(proxyRef.current!);

  return proxyRef.current!;
}

/**
 * Determines whether the given target is a proxy object.
 *
 * This function checks if the target is a proxy by:
 * - Returning `false` immediately if the target is a primitive value.
 * - Checking if the target has a defined version (using Valtio's `getVersion`), which indicates it is a proxy.
 * - If not, attempting to retrieve the underlying target from a Valtio proxy and checking its version.
 *
 * @param target - The value to check for proxy status.
 * @returns `true` if the target is a proxy, otherwise `false`.
 */
export function isProxy(target: any): boolean {
  if (isPrimitive(target)) return false;

  if (getVersion(target) !== undefined) {
    return true;
  }

  const valtioTarget = getValtioProxyTarget(target);
  return getVersion(valtioTarget) !== undefined;
}

/**
 * Determines if the provided value is a Valtio proxy object.
 *
 * Checks for the presence of the `VALTIO_PROXY_TARGET` property to identify
 * if the value is a Valtio proxy.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a Valtio proxy, otherwise `false`.
 */
export function isValtio(value: any): boolean {
  return (value as any)?.[VALTIO_PROXY_TARGET] !== undefined;
}

/**
 * Determines if the provided value is a Ref proxy by checking for the presence
 * of the `IS_REF_PROXY` property.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a Ref proxy, otherwise `false`.
 */
export function isRef(value: any): boolean {
  return (value as any)?.[IS_REF_PROXY] === true;
}

/**
 * Determines if the provided value is a reactive proxy.
 *
 * Checks for the presence of the `IS_REACTIVE_PROXY` property on the value,
 * which indicates that the object has been wrapped as a reactive proxy.
 *
 * @param value - The value to check for reactivity.
 * @returns `true` if the value is a reactive proxy, otherwise `false`.
 */
export function isReactive(value: any): boolean {
  return (value as any)?.[IS_REACTIVE_PROXY] === true;
}

/** @private */
export function markAsRefState<T>(target: T): T {
  setProxyMeta(target as object, { [IS_REF_PROXY]: true });
  return target;
}

/** @private */
export function markAsReactiveState<T extends object>(target: T): T {
  setProxyMeta(target, { [IS_REACTIVE_PROXY]: true });
  return target;
}

/** @private */
export function setProxyMeta(object: object, data: Record<string, any>) {
  for (const key in data) {
    Object.defineProperty(object, key, {
      value: data[key],
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

/**
 * @private
 * 解包当前 proxy 对象内部的 Valtio proxy
 */
export function getValtioProxyTarget<T extends object>(target: T): object {
  const innerProxy = (target as any)[VALTIO_PROXY_TARGET];
  return innerProxy ?? target;
}

type ProxyAccessCollector = (proxy: object) => void;

let activeCollector: ProxyAccessCollector | null = null;

/**
 * @private
 * 拦截执行期间所有的 Proxy get 操作
 */
export function collectProxyAccess<T>(fn: () => T): { value: T; proxies: Set<object> } {
  const proxies = new Set<object>();
  const prev = activeCollector;
  activeCollector = (proxy) => proxies.add(proxy);
  try {
    return { value: fn(), proxies };
  } finally {
    activeCollector = prev;
  }
}

function trackProxyAccess(proxy: object) {
  if (activeCollector) {
    activeCollector(proxy);
  }
}
