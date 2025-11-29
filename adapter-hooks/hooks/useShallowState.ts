import { useState$ } from './useState$';

export function useShallowState<S>(initialState: S | (() => S)) {
  return useState$(initialState, true) as [S, React.Dispatch<React.SetStateAction<S>>];
}
