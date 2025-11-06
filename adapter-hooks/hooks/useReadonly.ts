import { deepFreeze } from 'deep-freeze-es6';
import { useMemo } from 'react';

/**
 * `useReadonly` will deeply freeze the entire object and return the memoized value.
 *
 * @example
 *
 * ```ts
 * const object = useReadonly({ a: 'b', c: { d: 'e', f: ['g'] } })
 * object.c.f.push('h') // Modification attempts will throw an error.
 * ```
 */
export function useReadonly<T>(initialState: T): T;

export function useReadonly<T>(initialState: () => T): T {
  const state = typeof initialState === 'function' ? initialState() : initialState;
  return useMemo(() => deepFreeze(state), [state]);
}

/**
 * `useShallowReadonly` only freezes the object's first-level properties
 * and returns the memoized value.
 *
 * @example
 *
 * ```ts
 * const object = useReadonly({ a: 'b', c: { d: 'e' } })
 * object.a = 'f' // Modification attempts will throw an error.
 * object.c.d = 'g' // Modifications to nested child objects cannot be prevented.
 * ```
 */
export function useShallowReadonly<T>(initialState: T): T;

export function useShallowReadonly<T>(initialState: () => T): T {
  const state = typeof initialState === 'function' ? initialState() : initialState;
  return useMemo(() => Object.freeze(state), [state]);
}
