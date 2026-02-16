import { useEffect } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onMounted.
 */
export function useMounted(fn: EffectCallback): void {
  useEffect(() => executeEffect(fn), []);
}
