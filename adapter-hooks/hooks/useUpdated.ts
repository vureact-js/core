import { DependencyList, useEffect } from 'react';
import { EffectCallback } from '../types';
import { useIsFirstMount } from './useIsFirstMount';

export function useUpdated(fn: EffectCallback, deps?: DependencyList): void {
  const firstMount = useIsFirstMount();

  useEffect(() => {
    if (firstMount) {
      return;
    }

    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
