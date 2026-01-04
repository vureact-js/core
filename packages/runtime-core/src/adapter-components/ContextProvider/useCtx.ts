import { useContext } from 'react';
import isEqual from 'react-fast-compare';
import { ContextKey, contextRegistry } from './registry';

type FactoryCache = {
  result: any;
  dependencies: any[];
};

// 工厂函数结果缓存（带依赖追踪）
const factoryCache = new Map<ContextKey, FactoryCache>();

/**
 * Retrieves a value from the context registry.
 *
 * Mimics Vue's `inject()` API with TypeScript support.
 * Supports simple values and factory functions as defaults.
 *
 * @param name - Context identifier key
 * @param defaultValue - Optional default value or factory
 * @param treatDefaultAsFactory - Treat defaultValue as factory function
 * @returns Context value, default value, or undefined
 *
 * @example
 *
 * const value = useCtx<number>('count');
 * const withDefault = useCtx('count', 0);
 * const withFactory = useCtx('count', () => Date.now(), true);
 *
 * @see https://vureact.vercel.app/en/adapter-components/context-provider
 */
export function useCtx<T>(name: ContextKey): T | undefined;
export function useCtx<T>(name: ContextKey, defaultValue: T, treatDefaultAsFactory?: false): T;
export function useCtx<T>(name: ContextKey, defaultValue: () => T, treatDefaultAsFactory: true): T;

export function useCtx<T>(
  name: ContextKey,
  defaultValue?: T | (() => T),
  treatDefaultAsFactory?: boolean,
): T | undefined {
  const Context = contextRegistry.getContext<T>(name);

  if (!Context) {
    if (defaultValue !== undefined) {
      return getDefaultValue(defaultValue, treatDefaultAsFactory, name, [name]);
    }

    console.warn(`[useCtx] Context with name "${String(name)}" not found.`);
    return undefined;
  }

  const contextValue = useContext(Context);

  if (contextValue === undefined && defaultValue !== undefined) {
    // 只在没有 Provider 值时才使用默认值
    const deps = [name, treatDefaultAsFactory, defaultValue];
    return getDefaultValue(defaultValue, treatDefaultAsFactory, name, deps);
  }

  return contextValue;
}

// 智能获取默认值
function getDefaultValue<T>(
  defaultValue: T | (() => T),
  treatDefaultAsFactory: boolean | undefined,
  name: ContextKey,
  dependencies: any[],
): T {
  // 如果是普通值，直接返回
  if (treatDefaultAsFactory !== true || typeof defaultValue !== 'function') {
    return defaultValue as T;
  }

  // 工厂函数：需要缓存
  const factory = defaultValue as () => T;

  // 检查缓存是否有效
  const cached = factoryCache.get(name);

  const isCacheValid = cached && isEqual(cached.dependencies, dependencies);

  if (isCacheValid && cached) {
    return cached.result;
  }

  // 计算新值并缓存
  const result = factory();

  factoryCache.set(name, {
    result,
    dependencies: [...dependencies],
  });

  return result;
}
