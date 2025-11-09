import { freeze } from 'freeze-mutate';
import { klona as deepClone } from 'klona';
import { useMemo } from 'react';
import type { Primitive } from '../types';
import { isObject } from '../utils';

type ReadonlyObject<T> = Readonly<T extends Primitive ? { value: T } : T>;

/**
 * `useReadonly` will deeply freeze the entire object, prohibiting any modifications.
 */
export function useReadonly<T>(initialState: T): ReadonlyObject<T>;

export function useReadonly<T>(initialState: () => T): ReadonlyObject<T> {
  return useMemo(() => readonly(initialState), [initialState]);
}

/**
 * `useShallowReadonly` only freezes the shallow layer of the object.
 */
export function useShallowReadonly<T>(initialState: T): ReadonlyObject<T>;

export function useShallowReadonly<T>(initialState: () => T): ReadonlyObject<T> {
  return useMemo(() => readonly(initialState, false), [initialState]);
}

function readonly<T>(initialState: T | (() => T), deep = true): ReadonlyObject<T> {
  const state = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
  const object = !isObject(state) ? { value: state } : state;
  return freeze(deepClone(object), deep) as ReadonlyObject<T>;
}
