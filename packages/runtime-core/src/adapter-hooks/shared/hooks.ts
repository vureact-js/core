import { useSyncExternalStore } from 'react';
import { Snapshot, snapshot, subscribe } from 'valtio/vanilla';

/**
 * 订阅 valtio 代理的响应式状态变化，并通知 React 更新
 */
export function useProxySubscribe<T extends object>(
  target: T,
  getSnapshot?: () => T | Snapshot<T>,
): Snapshot<T> {
  return useSyncExternalStore(
    (callback) => subscribe(target, callback),
    !getSnapshot ? () => snapshot(target) : getSnapshot,
  ) as any;
}
