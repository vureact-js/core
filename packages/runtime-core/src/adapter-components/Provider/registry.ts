import { createContext } from 'react';

export type ContextKey = string | number | symbol;

/**
 * 全局上下文注册表，管理所有 React 上下文的创建和获取。
 *
 * 此类提供单例模式的上下文管理，确保相同名称的上下文只创建一次。
 * 支持字符串、数字和 Symbol 作为上下文标识符。
 *
 * @example
 * ```typescript
 * // 创建或获取上下文
 * const context = contextRegistry.create('theme', 'light');
 *
 * // 获取已存在的上下文
 * const existingContext = contextRegistry.getContext('theme');
 *
 * // 清空所有上下文（主要用于测试）
 * contextRegistry.clear();
 * ```
 */
class GlobalContextRegistry {
  private map = new Map<ContextKey, React.Context<any>>();

  /**
   * 创建或获取指定名称的 React 上下文
   *
   * @param name - 上下文标识符
   * @param defaultValue - 可选的默认值
   * @returns React 上下文实例
   */
  create<T>(name: ContextKey, defaultValue?: T): React.Context<T> {
    if (!this.map.has(name)) {
      this.map.set(name, createContext<T | undefined>(defaultValue));
    }
    return this.getContext(name);
  }

  /**
   * 获取指定名称的 React 上下文
   *
   * @param name - 上下文标识符
   * @returns 已注册的 React 上下文实例
   * @throws 如果上下文不存在，返回 undefined
   */
  getContext<T>(name: ContextKey): React.Context<T> {
    return this.map.get(name)!;
  }

  /**
   * 清空所有已注册的上下文
   *
   * 主要用于测试环境或需要重置上下文状态的场景。
   */
  clear() {
    this.map.clear();
  }
}

/**
 * 全局上下文注册表单例实例
 *
 * 在整个应用中共享的上下文注册表，确保上下文的一致性和复用。
 */
export const contextRegistry = new GlobalContextRegistry();
