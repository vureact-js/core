import { useState$ } from './useState$';

/**
 * @see https://vureact.vercel.app/en/adapter-hooks/useShallowState
 */
export function useShallowState<S>(initialState: S | (() => S)) {
  return useState$(initialState, true) as [S, React.Dispatch<React.SetStateAction<S>>];
}
