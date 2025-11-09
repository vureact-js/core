import { type Dispatch, type SetStateAction, useState } from 'react';
import type { Primitive } from 'types';
import { type ImmerHook, useImmer } from 'use-immer';

export type SmartStateReturn<S> = [S] extends [Primitive]
  ? [S, Dispatch<SetStateAction<S>>]
  : ImmerHook<S>;

/**
 * `useSmartState` will automatically selects the appropriate value type:
 * `useState` for simple values ​​and `useImmer` for complex values.
 * 
 * @example
 * 
 * ```ts 
   // The setter inference type for simple values ​​is SetStateAction of type useState.
 * const [state, setState] = useSmartState(1);

   // setState: (value: SetStateAction<number>) => void
 * setState(2);

   // The setter inference type for complex values ​​is DraftFunction of useImmer.
 * const [data, updateState] = useSmartState({ name: 'react', list: [] });

   // updateState: (DraftFunction<{name: string; list: never[]}>) => void
 * updateState((draft) => {
    // You can make any modifications to the draft object.
 *  draft.name = 'eddie';
 *  draft.list.push(1)
 * });
 * ```
 * 
 * `useImmer` documentation
 * @see https://github.com/mweststrate/use-immer#readme
 */
export function useSmartState<S>(initialState: S): SmartStateReturn<S>;

export function useSmartState<S>(initialState: () => S): [S, unknown] {
  const state = typeof initialState === 'function' ? initialState() : initialState;
  if (state !== null && typeof state === 'object') {
    return useImmer(state) as SmartStateReturn<S>;
  }
  return useState(state) as SmartStateReturn<S>;
}
