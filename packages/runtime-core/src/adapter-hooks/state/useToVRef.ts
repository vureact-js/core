import { useMemo } from 'react';
import { useProxySubscribe } from '../shared/hooks';
import { isProxy, isRef, markAsRefState } from '../shared/proxy';
import { RefState, WrapRef, useVRef } from './useVRef';

export type ToRefState<T> =
  | ToRefValueState<T>
  | ToRefPropertyState<T, keyof T>
  | Readonly<RefState<T>>;

export type ToRefValueState<T> = T extends WrapRef<infer T> ? T : RefState<T>;

export type ToRefPropertyState<T, K extends keyof T> = T extends object
  ? T[K] extends WrapRef<any>
    ? T[K]
    : RefState<T[K]>
  : never;

/**
 * Creates a reactive reference state from a given value, object property, or getter function.
 *
 * This hook supports three usage patterns:
 *
 * - **Object Property to Ref**: If a `key` is provided, creates a ref for a specific property of an object.
 *    - Subscribes to changes if the object is a proxy.
 *    - Optionally accepts a `defaultValue` for the property.
 *
 * - **Getter Function to Readonly Ref**: If a function is provided as `value`, creates a readonly ref that tracks the getter's result.
 *
 * - **Proxy or Plain Value**: If a proxy or a plain value is provided, returns it as a ref state.
 *    - Subscribes to changes if the value is a proxy.
 *
 * @see https://runtime.vureact.top/guide/hooks/to-v-ref.html
 *
 * @example
 *
 * const state = useReactive({
 *   foo: 1,
 *   bar: 2
 * })
 *
 * const fooRef = useToVRef(state, 'foo')
 *
 * // mutating the ref updates the original
 * fooRef.value++
 * console.log(state.foo) // 2
 *
 * // mutating the original also updates the ref
 * state.foo++
 * console.log(fooRef.value) // 3
 *
 * @param value - The source value, object, or getter function.
 * @param key - (Optional) The property key to create a ref for (if using object property mode).
 * @param defaultValue - (Optional) The default value for the property ref.
 * @returns A reactive reference state corresponding to the input pattern.
 */
export function useToVRef<T>(value: T): ToRefValueState<T>;

export function useToVRef<T>(value: () => T): Readonly<RefState<T>>;

export function useToVRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
): ToRefPropertyState<T, K>;

export function useToVRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue: T[K],
): ToRefPropertyState<T, K>;

export function useToVRef<T, K extends keyof T>(
  value: T | (() => T),
  key?: K,
  defaultValue?: T[K],
): ToRefState<T> {
  const isPropToRef = arguments.length > 1;

  // 模式 1：对象属性转 Ref (toRef(obj, 'key'))
  if (isPropToRef) {
    const object = value as T & object;

    // 订阅源 proxy 的变动
    if (isProxy(object)) {
      useProxySubscribe(object);
    }

    return useMemo(
      () => toPropertyRefState(object, key!, defaultValue as (T & object)[keyof (T & object)]),
      [object, key, defaultValue],
    ) as ToRefPropertyState<T, keyof T>;
  }

  const isGetter = typeof value === 'function';

  // 模式 2：Getter 函数转只读 Ref
  if (isGetter) {
    return useMemo(() => createGetterRef(value as () => T), [value]) as Readonly<RefState<T>>;
  }

  // 模式 3：已经是代理或普通值
  if (isProxy(value)) {
    useProxySubscribe(value as object); // 订阅变更
    return value as ToRefValueState<T>;
  }

  return useVRef(value as T);
}

// 将对象的某个属性关联到 Ref 的 .value 上
export function toPropertyRefState<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue?: T[K],
): ToRefPropertyState<T, K> {
  const sourceValue = object[key];

  if (sourceValue && isRef(sourceValue)) {
    return sourceValue as ToRefPropertyState<T, K>;
  }

  // 不直接使用 Valtio proxy，而是手动代理属性
  const refState = {
    get value() {
      const value = object[key];
      return (value === undefined ? defaultValue : value) as T[K];
    },
    set value(newValue: T[K]) {
      // 当修改 .value 时，实际上是在修改原始对象的属性
      object[key] = newValue;
    },
  } as RefState<T[K]>;

  return markAsRefState(refState) as ToRefPropertyState<T, K>;
}

function createGetterRef<T>(getter: () => T): Readonly<RefState<T>> {
  const refState = {
    get value() {
      return getter();
    },
    set value(_: T) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cannot assign to readonly ref created from getter');
      }
    },
  } as RefState<T>;

  return markAsRefState(refState) as Readonly<RefState<T>>;
}
