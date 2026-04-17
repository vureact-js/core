import { createContext, useContext } from 'react';

export const RuntimeSuspenseBoundaryContext = createContext(false);

export function useRuntimeSuspenseBoundary() {
  return useContext(RuntimeSuspenseBoundaryContext);
}
