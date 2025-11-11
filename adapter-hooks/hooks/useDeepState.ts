import { enableMapSet } from 'immer';
import { type ImmerHook, useImmer } from 'use-immer';
import { isObject } from '../utils';

export type DeepStateHook<S> = ImmerHook<S>;

/**
 * `useDeepState` only accepts values of object type. 
 * It is implemented based on `useImmer` and allows manipulating "immutable" data in a "mutable" manner. 
 * It is comparable to Vue's `ref({...})` or `reactive({...})`.
 * 
 * @example
 * 
 * ```ts
 * const [person, updatePerson] = useDeepState({ 
 *   name: 'Alice', 
 *   info: { age: 30, city: 'London' }
 * });
 *
   // If you want to update city:
 * updatePerson(person => {
 *   person.info.city = 'Paris'; // Modify directly as if operating on a regular object.
 * });
 * ```
 */
export function useDeepState<S extends object>(obj: S | (() => S)): DeepStateHook<S> {
  const state = typeof obj === 'function' ? obj() : obj;

  if (!isObject(state)) {
    console.error('[useDeepState] The state must be of object type. Do not use primitive values.');
    // @ts-ignore
    return useImmer(undefined);
  }

  return useImmer(state);
}

// 启用 useImmer 对 Map 和 Set 集合类型的支持
enableMapSet();
