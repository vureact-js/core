import { ref } from 'valtio/vanilla';
import { IS_REF_PROXY, IS_ROOT } from '../shared/consts';
import { createProxy, isProxy, isRef, isRoot } from '../shared/proxy';
import { isPrimitive } from '../shared/utils';

export type RefState<T = unknown> = T extends WrapRef<infer T> ? T : WrapRef<T>;

export interface WrapRef<T = unknown> {
  value: T;
}

export type UnwrapRef<T> = T extends WrapRef<infer U> ? U : unknown;

/**
 * @private
 * Wraps the target in an object, accessible via the `value` property.
 */
export function wrapRef<T>(target: T): WrapRef<T> {
  return { value: target };
}

/**
 * @private
 * Unwraps the `value` property from `useVRef`.
 */
export function unwrapRef<T extends WrapRef<any>>(ref: T): UnwrapRef<T> {
  if (isRef(ref) && isRoot(ref)) {
    // 只有根节点需要解包
    return ref.value;
  }
  return ref as any;
}

/**
 * Creates a reactive reference state initialized with the provided value.
 *
 * @see https://runtime.vureact.top/guide/hooks/v-ref.html
 *
 * @example
 *
 * const countRef = useVRef(1);
 * countRef.value++; // Triggers updates for subscribed components
 *
 * @param initialValue - The initial value for the reference state.
 * @returns A `RefState<T>` object representing the reactive state.
 */
export function useVRef<T>(initialValue: T): RefState<T> {
  return createStateRef(initialValue);
}

/**
 * Creates a shallow reactive reference state for the given initial value.
 *
 * @example
 *
 * const countRef = useShallowVRef({ count: 1 });
 * countRef.value.count++; // Does not trigger component updates
 * countRef.value = { count: 3 } // Replacing the entire object will trigger updates
 *
 * @param initialValue - The initial value to be stored in the shallow ref state.
 * @returns A `RefState<T>` object that holds the shallow reactive state.
 */
export function useShallowVRef<T>(initialValue: T): RefState<T> {
  return createStateRef(initialValue, true);
}

function createStateRef<T>(initialValue: T, shallow = false): RefState<T> {
  if (isProxy(initialValue)) {
    // 返回已代理过的对象
    return initialValue as RefState<T>;
  }

  const target = wrapRef(initialValue);
  const isComplex = !isPrimitive(initialValue);

  if (shallow && isComplex) {
    // 如果值是对象才用 ref() 锁定 value，防止深层代理（行为更接近 Vue 的 shallowRef）
    target.value = ref(initialValue as object) as any;
  }

  // 当为浅 ref 时，不对目标进行深拷贝（会破坏 valtio.ref 标记），
  // 否则浅 ref 的语义（锁定内部对象）会失效。
  return createProxy(target, {
    clone: isComplex && !shallow,
    meta: { [IS_ROOT]: true, [IS_REF_PROXY]: true },
  }) as RefState<T>;
}
