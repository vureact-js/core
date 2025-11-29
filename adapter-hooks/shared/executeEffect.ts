import { type Destructor } from '../types';
import { isPromise } from '../utils/is';

/**
 * 通用 Effect 执行器，
 * 无论函数是同步还是异步，都返回同步的清理函数
 *
 * @param effectFn effect
 * @param onCleanup 当 effect 是异步才用这个它接收
 * @returns 同步 effect 的清理函数
 */
export function executeEffect<T extends (...args: any[]) => any>(
  effectFn: T,
  onCleanup?: (cleanup: Destructor) => void,
): Destructor {
  let isMounted = true;
  let asyncCleanup: any = null;

  const result = effectFn();

  // 处理异步函数
  if (isPromise(result)) {
    result.then((cleanup: any) => {
      if (isMounted) {
        asyncCleanup = cleanup;
        // 通知外部有新的清理函数
        onCleanup?.(cleanup);
      }
    });

    // 返回同步清理函数
    return () => {
      isMounted = false;
      if (typeof asyncCleanup === 'function') asyncCleanup();
    };
  }

  // 同步函数直接返回清理函数
  return result;
}
