import { useEffect } from 'react';
import { type EffectCallback } from '../shared/types';

/**
 * @see https://react-vue3-hooks.vercel.app/en/hooks/useMounted
 */
export function useMounted(fn: EffectCallback) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
