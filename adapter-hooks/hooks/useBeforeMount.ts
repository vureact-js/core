import { useLayoutEffect } from 'react';
import { EffectCallback } from '../types';

/**
 * Synchronously executed after DOM mounting and before painting,
 * it is the timing closest to onBeforeMount.
 */
export function useBeforeMount(fn: EffectCallback) {
  useLayoutEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
