import { useMount } from 'react-use';
import { type EffectCallback } from '../types';

export function useMounted(fn: EffectCallback) {
  useMount(() => {
    fn();
  });
}
