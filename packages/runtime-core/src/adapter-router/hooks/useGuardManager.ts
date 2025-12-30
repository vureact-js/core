import { useRouterContext } from '../context/RouterContext';
import { type GuardManagerImpl } from '../guards/guardManager';

export function useGuardManager(): GuardManagerImpl {
  const { guardManager } = useRouterContext();
  return guardManager;
}
