import { useLayoutEffect } from 'react';
import { EffectCallback } from '../shared/types';

/**
 * Synchronously executed after DOM mounting and before painting.
 *
 * @see https://vureact.vercel.app/en/adapter-hooks/useBeforeMount
 */
export function useBeforeMount(fn: EffectCallback) {
  useLayoutEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
