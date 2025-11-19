import { useEffect } from 'react';
import { useRouterContext } from '../context/RouterContext';
import { type ComponentGuards } from '../guards/GuardManager';

export function useBeforeRouteUpdate(fn: ComponentGuards['guard']) {
  const { guardManager } = useRouterContext();

  useEffect(
    () => guardManager.registerComponentGuard('beforeRouteUpdateGuards', fn),
    [fn, guardManager],
  );
}
