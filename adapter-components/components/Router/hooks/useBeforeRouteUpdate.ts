import { useEffect } from 'react';
import { useRouterContext } from '../context/RouterContext';
import { type ComponentGuards } from '../guards/GuardManager';

/**
 * will trigger when the current route is updated, and only for route parameter changes.
 *
 * @see https://react-vue3-components.vercel.app/en/router/navigation-guards
 *
 * @param fn update guard
 */
export function useBeforeRouteUpdate(fn: ComponentGuards['guard']) {
  const { guardManager } = useRouterContext();

  useEffect(
    () => guardManager.registerComponentGuard('beforeRouteUpdateGuards', fn),
    [fn, guardManager],
  );
}
