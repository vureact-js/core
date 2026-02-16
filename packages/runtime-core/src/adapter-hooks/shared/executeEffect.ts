import { type Destructor, type OnCleanup } from './types';
import { isPromise } from './utils';

/**
 * Execute sync/async effects and normalize cleanup lifecycle.
 */
export function executeEffect<T extends (...args: any[]) => any>(
  effectFn: T,
  onCleanup?: OnCleanup,
): Destructor {
  let stopped = false;
  let cleanup: Exclude<Destructor, void> | undefined;
  let hasRegisteredByCallback = false;

  const registerCleanup: OnCleanup = (value) => {
    if (typeof value !== 'function') {
      return;
    }

    hasRegisteredByCallback = true;
    cleanup = value;
    onCleanup?.(value);
  };

  const runCleanup = () => {
    if (typeof cleanup !== 'function') {
      return;
    }

    const current = cleanup;
    cleanup = undefined;
    current();
  };

  const applyResolvedCleanup = (resolved: any) => {
    if (typeof resolved !== 'function') {
      return;
    }

    // If onCleanup has registered one in this run, callback registration wins.
    if (hasRegisteredByCallback) {
      if (stopped) {
        resolved();
      }
      return;
    }

    if (stopped) {
      resolved();
      return;
    }

    registerCleanup(resolved);
  };

  const result = effectFn(registerCleanup);

  if (isPromise(result)) {
    result.then((resolvedCleanup: any) => {
      applyResolvedCleanup(resolvedCleanup);
    });
  } else {
    applyResolvedCleanup(result);
  }

  return () => {
    stopped = true;
    runCleanup();
  };
}
