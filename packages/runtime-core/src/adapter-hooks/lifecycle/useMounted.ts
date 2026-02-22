import { useEffect } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onMounted.
 * @see https://vureact-runtime.vercel.app/guide/hooks/mounted
 */
export function useMounted(fn: EffectCallback): void {
  useEffect(() => executeEffect(fn), []);
}
