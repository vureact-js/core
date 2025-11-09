import { enableMapSet } from 'immer';
import { useState } from 'react';
import { useImmer } from 'use-immer';
import { isObject } from '../utils';

export type SmartStateHook<S> = [S, SmartUpdater<S>];

export type SmartUpdater<S> = (draft: State<S> | UpdateFunction<S>) => void;

export type UpdateFunction<S> = (draft: S) => UpdateFunctionReturnType<S>;

export type UpdateFunctionReturnType<S> = State<S> | void;

export type State<S> = Partial<S>;

/**
 * `useSmartState` returns a stateful value and a function to update it.
 * The update function allows direct modification of the properties and values of the state.
 *
 */
export function useSmartState<S>(initialState: S | (() => S)): SmartStateHook<S>;

export function useSmartState<S>(initialState: () => S): SmartStateHook<S>;

export function useSmartState<S>(initialState: S) {
  const state = typeof initialState === 'function' ? initialState() : initialState;
  if (isObject(state)) {
    return useImmer(state);
  }
  return useState(state);
}

// 启用 useImmer 对 Map 和 Set 集合类型的支持
enableMapSet();
