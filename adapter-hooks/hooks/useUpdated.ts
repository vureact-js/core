import { useEffect } from 'react';
import { EffectCallback } from '../types';
import { useIsFirstMount } from './useIsFirstMount';

export function useUpdated(fn: EffectCallback): void {
  const firstMount = useIsFirstMount();

  useEffect(() => {
    if (firstMount) {
      return;
    }

    fn();
  });
}
