import { useEffect } from 'react';
import type { EffectCallback } from '../types';

export function useUnmounted(fn: EffectCallback) {
  useEffect(
    () => () => {
      fn();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
