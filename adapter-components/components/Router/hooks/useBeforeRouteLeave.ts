import { useEffect } from 'react';
import { useRouterContext } from '../context/RouterContext';
import { type ComponentGuards } from '../guards/GuardManager';

/**
 * will trigger when leaving the current route, prior to all other guards.
 *
 * @param fn leave guard
 */
export function useBeforeRouteLeave(fn: ComponentGuards['guard']) {
  const { guardManager } = useRouterContext();

  useEffect(() => {
    return guardManager.registerComponentGuard('beforeRouteLeaveGuards', fn);
  }, [fn, guardManager]);
}
