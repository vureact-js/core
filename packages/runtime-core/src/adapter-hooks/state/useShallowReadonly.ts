import { useReadonly } from './useReadonly';

/**
 * @see https://vureact-runtime.vercel.app/en/hooks/useShallowReadonly
 */
export function useShallowReadonly<T extends object>(initialState: T): Readonly<T> {
  return useReadonly(initialState, true);
}
