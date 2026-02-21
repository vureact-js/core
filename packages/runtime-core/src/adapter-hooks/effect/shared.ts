import { DependencyList, useEffect, useLayoutEffect } from 'react';
import { Destructor, FlushTiming } from '../shared/types';

export function useFlushEffect(
  flush: FlushTiming,
  fn: () => Destructor,
  deps: DependencyList,
): void {
  const hookType = resolveFlushEffectHook(flush);
  const isLayout = hookType === 'layout';
  const effect = isLayout ? useLayoutEffect : useEffect;

  effect(() => {
    return fn();
  }, deps);
}

function resolveFlushEffectHook(flush: FlushTiming): 'effect' | 'layout' {
  return flush === 'post' ? 'effect' : 'layout';
}
