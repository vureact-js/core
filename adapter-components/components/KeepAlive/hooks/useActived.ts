import { useEffect, useRef } from 'react';
import { useInnerKeepAliveKey, useKeepAliveLifeContext } from '../context';

/**
 * The calls are made on the first mount and each time
 * the item is re-inserted from the cache.
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
