import { useEffect } from 'react';
import { type EffectCallback } from '../types';

export function useMounted(fn: EffectCallback) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
