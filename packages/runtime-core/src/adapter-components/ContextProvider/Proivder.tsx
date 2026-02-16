import { PropsWithChildren } from 'react';
import { ContextKey, contextRegistry } from './registry';

export interface CtxProviderProps<T, K = ContextKey> extends PropsWithChildren {
  /**
   * Unique identifier for the context.
   * Used by `useCtx` hook to retrieve this value.
   *
   * @example "user", "theme", "settings"
   */
  name: K;

  /**
   * The value to provide to all descendant components.
   * Can be any JavaScript value including objects, arrays, or functions.
   *
   * @example { id: 1, name: "John" }
   * @example "dark"
   * @example () => fetchUser()
   */
  value: T;
}

/**
 * 上下文提供者组件，用于向后代组件提供数据。
 *
 * 该组件会根据传入的名称创建或获取对应的 React 上下文，
 * 并通过 `useCtx` 钩子将值提供给所有子组件使用。
 *
 * @param props - 组件属性
 * @param props.name - 上下文的唯一标识
 * @param props.value - 要传递给后代组件的值
 * @param props.children - 可访问该上下文的 React 子组件
 *
 * @returns React Provider 组件
 *
 * @example
 *
 * <CtxProvider name="theme" value="dark">
 *   <ChildComponent />
 * </CtxProvider>
 */
export function CtxProvider<T, K = ContextKey>(props: CtxProviderProps<T, K>) {
  const { name, value, children } = props;
  const { Provider } = contextRegistry.create(name as ContextKey, value);

  return <Provider value={value}>{children}</Provider>;
}
