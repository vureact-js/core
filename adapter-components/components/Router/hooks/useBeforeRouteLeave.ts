import { useEffect } from 'react';
import { useRouterContext } from '../context/RouterContext';
import { type ComponentGuards } from '../guards/GuardManager';

export function useBeforeRouteLeave(fn: ComponentGuards['guard']) {
  const { guardManager } = useRouterContext();

  useEffect(() => {
    return guardManager.registerComponentGuard('beforeRouteLeaveGuards', fn);
  }, [fn, guardManager]);
}
