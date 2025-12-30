import { DependencyList, useEffect } from 'react';
import { EffectCallback } from '../shared/types';
import { useIsFirstMount } from '../shared/useIsFirstMount';

/**
 * @see https://vureact.vercel.app/en/adapter-hooks/useUpdated
 */
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
