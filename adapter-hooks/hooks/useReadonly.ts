import { freeze } from 'freeze-mutate';
import { klona as deepClone } from 'klona';
import { useMemo } from 'react';

type ReadonlyObject<T> = Readonly<T>;

/**
 * will deeply freeze the entire object, prohibiting any modifications.
 *
 * @param initialState
 * @param shallow only freezes the shallow layer of the object.
 */
export function useReadonly<T extends object>(
  initialState: T,
  shallow?: boolean,
): ReadonlyObject<T>;

export function useReadonly<T>(initialState: () => T, shallow = false) {
  return useMemo(() => readonly(initialState, !shallow), [initialState, shallow]);
}

function readonly<T extends object>(initialState: T | (() => T), deep = true): ReadonlyObject<T> {
  const state = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
  return freeze(deepClone(state), deep) as ReadonlyObject<T>;
}
