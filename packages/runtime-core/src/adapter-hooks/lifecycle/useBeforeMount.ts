import { useLayoutEffect } from 'react';
import { executeEffect } from '../shared/executeEffect';
import type { EffectCallback } from '../shared/types';

/**
 * Vue-like onBeforeMount (React approximation with useLayoutEffect).
 */
export function useBeforeMount(fn: EffectCallback): void {
  useLayoutEffect(() => executeEffect(fn), []);
}
