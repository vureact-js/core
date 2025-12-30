import { useEffect } from 'react';
import { useRouterContext } from '../context/RouterContext';
import { type ComponentGuards } from '../guards/guardManager';

/**
 * will trigger when leaving the current route, prior to all other guards.
 *
 * @see https://vureact.vercel.app/en/adapter-router/navigation-guards
 *
 * @param fn leave guard
 */
export function useBeforeRouteLeave(fn: ComponentGuards['guard']) {
  const { guardManager } = useRouterContext();

  useEffect(() => {
    return guardManager.registerComponentGuard('beforeRouteLeaveGuards', fn);
  }, [fn, guardManager]);
}
