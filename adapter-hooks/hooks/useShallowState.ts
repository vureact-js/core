import { type Dispatch, type SetStateAction, useState } from 'react';
import { isObject } from '../utils';

export type ShallowStateHook<S> = [S, Dispatch<SetStateAction<S>>];

/**
 * `useShallowState` is a wrapper for `useState` and is comparable to Vue's `shallowRef`.
 */
export function useShallowState<S>(value: S): ShallowStateHook<S> {
  return useState(value);
}

/**
 * `useShallowStates` is a wrapper for `useState` and is comparable to Vue's `shallowReactive`.
 */
export function useShallowStates<S extends object>(obj: S): ShallowStateHook<S> {
  if (!isObject(obj)) {
    console.error(
      '[useShallowStates] The state must be of object type. Do not use primitive values.',
    );
    // @ts-ignore
    return useShallowState();
  }
  return useShallowState(obj);
}
