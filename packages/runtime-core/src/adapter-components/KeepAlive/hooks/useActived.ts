import { useEffect, useRef } from 'react';
import { useInnerKeepAliveKey, useKeepAliveLifeContext } from '../context';

/**
 * React adapter for Vue's KeepAlive useActived hook.
 * @see https://runtime.vureact.top/guide/components/keep-alive.html
 */
export function useActived(fn: () => void) {
  const key = useInnerKeepAliveKey();
  const life = useKeepAliveLifeContext();
  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    if (!key || !life) return;

    const allowRetroactive = !hasRegisteredRef.current;
    const id = life.registerListener(key, { onActivate: fn }, allowRetroactive);

    hasRegisteredRef.current = true;

    return () => life?.unregisterListener(key, id);
  }, [key, life, fn]);
}
