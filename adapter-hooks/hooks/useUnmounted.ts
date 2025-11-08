import { useUnmount } from 'react-use';
import type { EffectCallback } from '../types';

export function useUnmounted(fn: EffectCallback) {
  useUnmount(() => {
    fn();
  });
}
