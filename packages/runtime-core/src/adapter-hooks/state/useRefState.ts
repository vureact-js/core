import { ref } from 'valtio/vanilla';
import { PROXY_FLAG_KEY, PROXY_FLAG_VALUE } from '../shared/consts';
import { isPrimitive } from '../shared/utils';
import { createProxy } from './useReactive';

export type RefState<T = unknown> = T extends WrapRef ? T : WrapRef<T>;

export interface WrapRef<T = unknown> {
  value: T;
}

/**
 * Creates and returns a reactive `ref` wrapper object (based on Valtio).
 *
 * Features:
 * - Behaves similarly to Vue's `ref`: returns a reactive reference wrapped with `value` for both primitive types and objects;
 * - Isolates complex types by default (deep clone + proxy) to avoid side effects caused by direct external references.
 *
 * @example
 *
 * const countRef = useRefState(1);
 * countRef.value++; // Triggers updates for subscribed components
 */
export function useRefState<T>(initialValue: T): RefState<T> {
  return createStateRef(initialValue);
}

/**
 * Creates a shallow proxy object (based on Valtio).
 *
 * Features:
 * - Behaves similarly to Vue's `shallowRef`: does not perform deep proxying on objects, but replacing the entire object will trigger updates;
 *
 * @example
 *
 * const countRef = useShallowRefState({ count: 1 });
 * countRef.value.count++; // Does not trigger component updates
 * countRef.value = { count: 3 } // Replacing the entire object will trigger updates
 */
export function useShallowRefState<T>(initialValue: T): RefState<T> {
  return createStateRef(initialValue, true);
}

function createStateRef<T>(initialValue: T, shallow = false): RefState<T> {
  if (isRefState(initialValue)) {
    return initialValue as RefState<T>;
  }

  const isComplex = !isPrimitive(initialValue);
  let target = { value: initialValue } as any;

  if (shallow && isComplex) {
    // 如果值是对象才用 ref() 锁定 value，防止深层代理（行为更接近 Vue 的 shallowRef）
    target.value = ref(initialValue as object);
  }

  // 当为浅 ref 时，不对目标进行深拷贝（会破坏 valtio.ref 标记），
  // 否则浅 ref 的语义（锁定内部对象）会失效。
  return createProxy(target, {
    clone: isComplex && !shallow,
    flag: PROXY_FLAG_VALUE.ref,
  }) as RefState<T>;
}

function isRefState(value: any): boolean {
  return (value as any)[PROXY_FLAG_KEY] === PROXY_FLAG_VALUE.ref;
}
