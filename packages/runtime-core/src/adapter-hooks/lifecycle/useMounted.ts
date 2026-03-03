import { useEffect } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onMounted.
 * @see https://runtime.vureact.top/guide/hooks/mounted.html
 */
export function useMounted(fn: EffectCallback): void {
  useEffect(() => executeEffect(fn), []);
}
