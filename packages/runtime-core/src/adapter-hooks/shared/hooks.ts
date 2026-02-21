import { useSyncExternalStore } from 'react';
import { Snapshot, getVersion, snapshot, subscribe } from 'valtio/vanilla';
import { getValtioProxyTarget } from './proxy';

/**
 * @private
 *
 * Subscribes a React component to changes in a proxy object (such as a Valtio proxy)
 * and returns a snapshot of the current state. This hook ensures the component re-renders
 * when the proxy state changes.
 *
 * @template T - The type of the target object.
 * @param target - The proxy object to subscribe to.
 * @param getSnapshot - Optional function to get the current snapshot of the state.
 * @returns A snapshot of the current state of the proxy object.
 */
export function useProxySubscribe<T extends object>(
  target: T,
  getSnapshot?: () => T | Snapshot<T>,
): Snapshot<T> {
  const valtioTarget = getValtioProxyTarget(target);
  const isValtioProxy = getVersion(valtioTarget as object) !== undefined;

  return useSyncExternalStore(
    (callback) => (isValtioProxy ? subscribe(valtioTarget as object, callback) : () => {}),
    !getSnapshot
      ? () => (isValtioProxy ? snapshot(valtioTarget as object) : (target as Snapshot<T>))
      : getSnapshot,
  ) as any;
}
