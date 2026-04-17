import { createElement, lazy, useEffect, useState, type ReactNode } from 'react';
import { useRuntimeSuspenseBoundary } from '../../adapter-components/Suspense/context';
import {
  AnyComponent,
  AnyProps,
  AsyncComponentLoader,
  AsyncComponentOptions,
  AsyncComponentResolveResult,
} from './types';
import { normalizeAsyncResolvedComponent } from './utils';

// 标记是否已经警告过hydrate选项未实现
let hasWarnedHydrateStrategy = false;

/**
 * React adapter for Vue's defineAsyncComponent.
 *
 * @see https://runtime.vureact.top/guide/utils/define-async-component.html
 */

// 持直接传入加载器函数
export function defineAsyncComponent<T extends AnyComponent = AnyComponent>(
  source: AsyncComponentLoader<T>,
): T;

// 持传入配置对象
export function defineAsyncComponent<T extends AnyComponent = AnyComponent>(
  source: AsyncComponentOptions<T>,
): T;

// 函数实现
export function defineAsyncComponent<T extends AnyComponent = AnyComponent>(
  source: AsyncComponentLoader<T> | AsyncComponentOptions<T>,
): T {
  // 统一处理参数：如果是函数，转换为配置对象
  const options = typeof source === 'function' ? { loader: source } : source;
  const {
    loader,
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout,
    suspensible = true,
    hydrate: hydrateStrategy,
    onError: userOnError,
  } = options;

  // 状态变量
  let pendingRequest: Promise<T> | null = null; // 当前正在进行的请求
  let resolvedComp: T | undefined; // 已解析的组件
  let retries = 0; // 重试次数

  /**
   * 重试加载函数
   */
  const retry = () => {
    retries += 1;
    pendingRequest = null; // 清除pending状态，允许重新加载
    return load();
  };

  /**
   * 加载组件的主要函数
   * 包含错误处理和请求去重逻辑
   */
  const load = (): Promise<T> => {
    let thisRequest: Promise<T> | null = null;

    return (
      pendingRequest || // 如果已有pending请求，直接返回它（去重）
      (thisRequest = pendingRequest =
        loader()
          .catch((err: unknown) => {
            // 规范化错误对象
            const normalizedError = err instanceof Error ? err : new Error(String(err));

            // 如果用户提供了错误处理回调
            if (userOnError) {
              return new Promise<AsyncComponentResolveResult<T>>((resolve, reject) => {
                const userRetry = () => resolve(retry());
                const userFail = () => reject(normalizedError);

                // 调用用户错误处理回调
                userOnError(normalizedError, userRetry, userFail, retries + 1);
              });
            }

            // 没有用户错误处理，直接抛出错误
            throw normalizedError;
          })
          .then((comp) => {
            // 检查请求是否已被新的请求取代（竞态条件处理）
            if (thisRequest !== pendingRequest && pendingRequest) {
              return pendingRequest;
            }

            // 规范化组件（处理ES模块格式）
            const normalizedComponent = normalizeAsyncResolvedComponent(comp);
            resolvedComp = normalizedComponent; // 缓存解析的组件
            return normalizedComponent;
          }))
    );
  };

  /**
   * 使用React.lazy创建的懒加载组件
   * 用于在Suspense边界内使用
   */
  const SuspensibleLazy = lazy(async () => {
    try {
      const loadedComponent = await load();
      return { default: loadedComponent as AnyComponent };
    } catch (err) {
      // 加载失败时，返回错误组件或空组件
      const fallbackError = err instanceof Error ? err : new Error(String(err));
      const fallbackComponent: AnyComponent = errorComponent
        ? () => createElement(errorComponent, { error: fallbackError })
        : () => null;

      return { default: fallbackComponent };
    }
  });

  /**
   * 异步组件包装器（实际返回的组件）
   */
  const AsyncComponentWrapper = (props: AnyProps): ReactNode => {
    // 检查是否在运行时Suspense边界内
    const isInRuntimeSuspenseBoundary = useRuntimeSuspenseBoundary();

    // 组件状态
    const [loaded, setLoaded] = useState(() => Boolean(resolvedComp));
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [delayed, setDelayed] = useState(() => delay > 0);

    /**
     * 副作用：开发环境下警告hydrate选项未实现
     */
    useEffect(() => {
      if (
        !hydrateStrategy ||
        hasWarnedHydrateStrategy ||
        // @ts-ignore
        process.env.NODE_ENV === 'production'
      ) {
        return;
      }

      hasWarnedHydrateStrategy = true;
      console.warn(
        '[defineAsyncComponent] `hydrate` option is currently a no-op in React runtime.',
      );
    }, []);

    /**
     * 副作用：加载组件
     */
    useEffect(() => {
      // 如果组件已解析，更新状态
      if (resolvedComp) {
        setLoaded(true);
        setDelayed(false);
        return;
      }

      let active = true; // 防止组件卸载后更新状态

      load()
        .then(() => {
          if (!active) {
            return;
          }

          setLoaded(true);
        })
        .catch((err) => {
          if (!active) {
            return;
          }

          const normalizedError = err instanceof Error ? err : new Error(String(err));
          setLoadError(normalizedError);
        });

      return () => {
        active = false; // 清理函数
      };
    }, []);

    /**
     * 副作用：处理延迟显示
     */
    useEffect(() => {
      if (resolvedComp || loadError || delay <= 0) {
        setDelayed(false);
        return;
      }

      const timer = setTimeout(() => {
        setDelayed(false);
      }, delay);

      return () => clearTimeout(timer);
    }, [delay, loadError]);

    /**
     * 副作用：处理加载超时
     */
    useEffect(() => {
      if (timeout == null || timeout < 0 || resolvedComp || loadError) {
        return;
      }

      const timer = setTimeout(() => {
        setLoadError(new Error(`Async component timed out after ${timeout}ms.`));
      }, timeout);

      return () => clearTimeout(timer);
    }, [loadError, timeout]);

    // 判断是否应该使用Suspense
    const shouldUseSuspense = suspensible && isInRuntimeSuspenseBoundary;

    // 组件已加载完成
    if (resolvedComp) {
      return createElement(resolvedComp as AnyComponent, props);
    }

    // 在Suspense边界内，使用React.lazy
    if (shouldUseSuspense) {
      return createElement(SuspensibleLazy, props);
    }

    // 加载错误且提供了错误组件
    if (loadError && errorComponent) {
      return createElement(errorComponent, { error: loadError });
    }

    // 正在加载中，且延迟时间已过，显示加载组件
    if (!loaded && loadingComponent && !delayed) {
      return createElement(loadingComponent, props);
    }

    // 默认返回null（不渲染任何内容）
    return null;
  };

  // 返回包装器组件
  return AsyncComponentWrapper as unknown as T;
}
