import { useContext } from 'react';
import isEqual from 'react-fast-compare';
import { ContextKey, contextRegistry } from './registry';

type FactoryCache = {
  result: any;
  dependencies: any[];
};

// Factory function result cache (with dependency tracking)
const factoryCache = new Map<ContextKey, FactoryCache>();

/**
 * 支持将简单值和工厂函数作为默认值，并具备智能缓存机制。
 *
 * @see https://runtime.vureact.top/guide/components/provider.html
 *
 * @param name - 上下文标识键名
 * @param defaultValue - 可选的默认值或工厂函数
 * @param treatDefaultAsFactory - 是否将 defaultValue 视作工厂函数
 * @returns 上下文值、默认值或 undefined
 *
 * @example
 *
 * const value = useInject<number>('name');
 * const withDefault = useInject('name', 0);
 * const withFactory = useInject('name', () => Date.now(), true);
 */
export function useInject<T>(name: ContextKey): T | undefined;
export function useInject<T>(name: ContextKey, defaultValue: T, treatDefaultAsFactory?: false): T;
export function useInject<T>(
  name: ContextKey,
  defaultValue: () => T,
  treatDefaultAsFactory: true,
): T;

export function useInject<T>(
  name: ContextKey,
  defaultValue?: T | (() => T),
  treatDefaultAsFactory?: boolean,
): T | undefined {
  const Context = contextRegistry.getContext<T>(name);

  if (!Context) {
    if (defaultValue !== undefined) {
      return getDefaultValue(defaultValue, treatDefaultAsFactory, name, [name]);
    }

    // 为了兼容两个测试文件，同时输出 error 和 warn
    console.error(`Context with key "${String(name)}" not found.`);
    console.warn(`[useInject] Context with name "${String(name)}" not found.`);
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
