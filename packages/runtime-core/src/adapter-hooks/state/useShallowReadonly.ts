import { useReadonly } from './useReadonly';

/**
 * @see https://vureact.vercel.app/en/adapter-hooks/useShallowReadonly
 */
export function useShallowReadonly<T extends object>(initialState: T): Readonly<T> {
  return useReadonly(initialState, true);
}
