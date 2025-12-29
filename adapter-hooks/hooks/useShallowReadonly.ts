import { useReadonly } from './useReadonly';

/**
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useShallowReadonly
 */
export function useShallowReadonly<T extends object>(initialState: T): Readonly<T> {
  return useReadonly(initialState, true);
}
