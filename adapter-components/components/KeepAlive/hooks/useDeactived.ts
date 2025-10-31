import { useEffect } from 'react';
import { useInnerKeepAliveKey, useKeepAliveLifeContext } from '../context';

/**
 * Called when removed from the DOM, cached, or
 * unloaded from the component.
 */
export function useDeactived(fn: () => void) {
  const key = useInnerKeepAliveKey();
  const life = useKeepAliveLifeContext();

  useEffect(() => {
    if (!key || !life) return;
    const id = life.registerListener(key, { onDeactivate: fn });
    return () => life.unregisterListener(key, id);
  }, [key, life, fn]);
}
