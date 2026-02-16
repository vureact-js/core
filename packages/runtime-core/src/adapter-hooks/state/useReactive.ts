import { ref } from 'valtio/vanilla';
import { IS_REACTIVE_PROXY, IS_ROOT, RAW_TARGET } from '../shared/consts';
import { createProxy, isProxy } from '../shared/proxy';
import { isPrimitive } from '../shared/utils';
import { UnwrapRef, unwrapRef, WrapRef } from './useRefState';

export type ReactiveState<T> = T extends WrapRef<any> ? UnwrapRef<T> : T;

/**
 * Creates a reactive proxy of the given target object, enabling reactivity tracking.
 *
 * @example
 *
 * const state = useReactive({ count: 0, nested: { n: 1 } });
 *
 * // Modifications will trigger component re-rendering
 * state.count++;
 * state.nested.n = 2;
 *
 * @param target - The object to be made reactive.
 * @returns The reactive proxy of the target object.
 */
export function useReactive<T extends object>(target: T): ReactiveState<T> {
  return createReactive(unwrapRef(target as WrapRef<any>));
}

/**
 * Creates a shallow reactive proxy of the given target object.
 *
 * Only the root-level properties of the object are made reactive; nested objects
 * are not deeply observed.
 *
 * @example
 *
 * const state = useShallowReactive({ a: { x: 1 } });
 *
 * // Will not cause component re-rendering
 * state.a.x++
 * // Direct replacement will trigger it
 * state.a = { x: 2 }
 *
 * @param target - The object to wrap in a shallow reactive proxy.
 * @returns The shallow reactive proxy of the target object.
 */
export function useShallowReactive<T extends object>(target: T): ReactiveState<T> {
  return createReactive(unwrapRef(target as WrapRef<any>), true);
}

function createReactive<T extends object>(target: T, shallow = false): T {
  if (isProxy(target)) {
    // 返回已代理过的对象
    return target;
  }

  let baseTarget: Record<string, any> = target;

  if (shallow) {
    // 手动浅拷贝对象
    baseTarget = { ...target };

    Object.keys(baseTarget).forEach((key) => {
      const val = baseTarget[key];

      // 只监听第一层的属性赋值
      if (!isPrimitive(val)) {
        baseTarget[key] = ref(val);
      }
    });
  }

  return createProxy(baseTarget as T, {
    clone: !shallow,
    originalTarget: baseTarget,
    meta: { [IS_ROOT]: true, [RAW_TARGET]: baseTarget, [IS_REACTIVE_PROXY]: true },
  });
}
