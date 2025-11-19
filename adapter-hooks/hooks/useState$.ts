import { enableMapSet } from 'immer';
import { useState } from 'react';
import { ImmerHook, useImmer } from 'use-immer';
import { Primitive } from '../types';
import { isPrimitive } from '../utils';

// 启用 useImmer 对 Map 和 Set 集合类型的支持
enableMapSet();

type StateHook<S> = S extends Primitive
  ? [S, React.Dispatch<React.SetStateAction<S>>]
  : ImmerHook<S>;

/**
 * For simple type values , use `useState`, and for complex type values, use `useImmer`.
 * @param initialState
 * @param shallow Regardless of the value type, use useState.
 *
 * @returns Returns a stateful value, and a function to update it.
 * 
 * @example Example of using complex type values
 * 
 * ```ts
 * const [state, updateState] = useState$({ 
 *   name: 'Alice', 
 *   info: { age: [30], city: 'London' }
 * });
 *
 * updateState(draft => {
     // Modify directly as if operating on a regular object.
 *   draft.info.city = 'Paris';
 *   draft.info.age.push(15)
 * });
 * ```
 */
export function useState$<S>(initialState: S, shallow?: boolean): StateHook<S>;

export function useState$<S>(initialState: () => S, shallow = false) {
  const state = typeof initialState === 'function' ? initialState() : initialState;

  if (shallow || isPrimitive(state)) {
    return useState(state);
  }

  return useImmer(initialState);
}
