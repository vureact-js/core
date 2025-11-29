import { useReadonly } from './useReadonly';

export function useShallowReadonly<T extends object>(initialState: T): Readonly<T> {
  return useReadonly(initialState, true);
}
