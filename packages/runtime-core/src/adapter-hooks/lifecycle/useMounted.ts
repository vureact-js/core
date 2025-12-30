import { useEffect } from 'react';
import { type EffectCallback } from '../shared/types';

/**
 * @see https://vureact.vercel.app/en/adapter-hooks/useMounted
 */
export function useMounted(fn: EffectCallback) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
