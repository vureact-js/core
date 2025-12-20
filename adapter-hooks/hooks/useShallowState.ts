import { useState$ } from './useState$';

/**
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useShallowState
 */
export function useShallowState<S>(initialState: S | (() => S)) {
  return useState$(initialState, true) as [S, React.Dispatch<React.SetStateAction<S>>];
}
