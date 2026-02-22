import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { subscribe } from 'valtio/vanilla';
import { collectProxyAccess, getValtioProxyTarget, markAsRefState } from '../shared/proxy';

export type ComputedGetter<T> = () => T;
export type ComputedSetter<T> = (value: T) => void;

export interface ComputedRef<T> {
  readonly value: T;
}

export interface WritableComputedRef<T> extends ComputedRef<T> {
  value: T;
}

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

/**
 * Creates a computed reference that automatically tracks reactive dependencies.
 *
 * @see https://vureact-runtime.vercel.app/guide/hooks/computed
 *
 * @example
 *
 * // Read-only computed ref
 * const doubled = useComputed(() => count.value * 2);
 *
 * // Writable computed ref
 * const fullName = useComputed({
 *   get: () => `${firstName.value} ${lastName.value}`,
 *   set: (value) => {
 *     const [first, last] = value.split(' ');
 *     firstName.value = first;
 *     lastName.value = last;
 *   }
 * });
 *
 * @remarks
 *
 * - The computed value is lazily evaluated and memoized
 * - Dependencies are automatically tracked via proxy interception
 * - The ref marks itself dirty when tracked dependencies change
 * - Read-only computed refs will warn in development if assignment is attempted
 *
 * @param getterOrOptions - Either a getter function that computes the value, or an object with `get` and optional `set` methods
 * @param getterOrOptions.get - Function that computes and returns the value
 * @param getterOrOptions.set - Optional function to handle value updates for writable computed refs
 * @returns A computed reference that reactively updates when dependencies change. If a setter is provided, the ref is writable; otherwise it's read-only
 */
export function useComputed<T>(getter: ComputedGetter<T>): ComputedRef<T>;

export function useComputed<T>(options: WritableComputedOptions<T>): WritableComputedRef<T>;

export function useComputed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
): ComputedRef<T> | WritableComputedRef<T> {
  // 参数标准化：解析出 getter 和 setter
  const getter = typeof getterOrOptions === 'function' ? getterOrOptions : getterOrOptions.get;
  const setter = typeof getterOrOptions === 'function' ? undefined : getterOrOptions.set;

  // 状态存储与版本控制
  const versionRef = useRef(0); // 用于触发 useSyncExternalStore 的更新版本号
  const valueRef = useRef<T>(undefined as T); // 缓存计算结果
  const dirtyRef = useRef(true); // 标记位：依赖是否已改变，需要重新计算
  const getterRef = useRef(getter);
  const setterRef = useRef(setter);

  // 存储所有依赖的取消订阅函数
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const listenersRef = useRef(new Set<() => void>());

  // 触发器：当依赖变动时调用
  const notify = useCallback(() => {
    versionRef.current++; // 递增版本号，React 会感知到 store 变化
    listenersRef.current.forEach((l) => l());
  }, []);

  // 清理旧的订阅关系，防止内存泄漏和错误触发
  const cleanupDeps = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];
  }, []);

  const markDirty = useCallback(() => {
    dirtyRef.current = true; // 标记为脏
    notify(); // 通知 React 重新渲染
  }, [notify]);

  if (getterRef.current !== getter) {
    getterRef.current = getter;
    dirtyRef.current = true;
  }

  if (setterRef.current !== setter) {
    setterRef.current = setter;
  }

  const recompute = useCallback(() => {
    if (!dirtyRef.current) {
      // 如果是干净的，直接返回缓存值
      return valueRef.current as T;
    }

    cleanupDeps();

    // collectProxyAccess 会拦截执行期间所有的 Proxy get 操作
    const { value, proxies } = collectProxyAccess(() => getterRef.current());

    valueRef.current = value;
    dirtyRef.current = false;

    // 为收集到的所有代理对象建立监听
    // 需要获取底层的 Valtio Target 才能进行原生订阅
    unsubscribersRef.current = Array.from(proxies).map((proxy) =>
      subscribe(getValtioProxyTarget(proxy) as object, markDirty),
    );

    return value;
  }, [cleanupDeps, markDirty]);

  useEffect(() => () => cleanupDeps(), [cleanupDeps]);

  useSyncExternalStore(
    (listener) => {
      listenersRef.current.add(listener);
      return () => listenersRef.current.delete(listener);
    },
    () => versionRef.current, // 返回版本号，React 比较此值决定是否重绘
    () => versionRef.current,
  );

  // 模拟 Vue 的 Ref 接口
  const computedRef = useMemo(() => {
    const ref = {
      get value() {
        return recompute();
      },
      set value(newValue: T) {
        const setterFn = setterRef.current;
        if (!setterFn) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Computed value is readonly');
          }
          return;
        }
        setterFn(newValue); // 执行用户定义的 setter
      },
    } as WritableComputedRef<T>;

    // 标记为 RefState，以便被 useToRaw 或 isRef 识别
    return markAsRefState(ref, true);
  }, [recompute]);

  return computedRef as ComputedRef<T> | WritableComputedRef<T>;
}
