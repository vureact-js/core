import { useLayoutEffect } from 'react';
import { EffectCallback } from '../types';

/**
 * Synchronously executed after DOM mounting and before painting.
 *
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useBeforeMount
 */
export function useBeforeMount(fn: EffectCallback) {
  useLayoutEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
