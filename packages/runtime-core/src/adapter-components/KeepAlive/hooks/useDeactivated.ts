import { useEffect } from 'react';
import { useInnerKeepAliveKey, useKeepAliveLifeContext } from '../context';

/**
 * React adapter for Vue's KeepAlive useDeactivated hook.
 * @see https://runtime.vureact.top/guide/components/keep-alive.html
 */
export function useDeactivated(fn: () => void) {
  const key = useInnerKeepAliveKey();
  const life = useKeepAliveLifeContext();

  useEffect(() => {
    if (!key || !life) return;
    const id = life.registerListener(key, { onDeactivate: fn });
    return () => life.unregisterListener(key, id);
  }, [key, life, fn]);
}
