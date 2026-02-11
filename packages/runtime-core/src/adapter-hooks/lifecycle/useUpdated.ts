import { DependencyList, useEffect } from 'react';
import { useIsFirstMount } from '../shared/hooks';
import { EffectCallback } from '../shared/types';

/**
 * @see https://vureact-runtime.vercel.app/en/hooks/useUpdated
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
