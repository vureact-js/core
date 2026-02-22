import { PropsWithChildren } from 'react';
import { ContextKey, contextRegistry } from './registry';

export interface ProviderProps<T, K = ContextKey> extends PropsWithChildren {
  /**
   * 上下文唯一标识。
   */
  name: K;
  /**
   * 提供给后代组件的值。
   */
  value: T;
}

/**
 * 上下文提供者组件，用于向后代组件提供数据。
 *
 * 该组件会根据传入的名称创建或获取对应的 React 上下文，
 * 并通过 `useInject` 钩子将值提供给所有子组件使用。
 *
 * @see https://vureact-runtime.vercel.app/guide/components/provider
 *
 * @param props - 组件属性
 * @param props.name - 上下文的唯一标识
 * @param props.value - 要传递给后代组件的值
 * @param props.children - 可访问该上下文的 React 子组件
 *
 * @returns React Provider 组件
 *
 * @example
 * ```tsx
 * // 父组件提供数据
 * <Provider name="theme" value="dark">
 *   <ChildComponent />
 * </Provider>
 *
 * // 在子组件内接收
 * // value -> 'dark'
 * const value = useInject<string>('theme')
 * ```
 */
export function Provider<T, K = ContextKey>(props: ProviderProps<T, K>) {
  const { name, value, children } = props;
  const { Provider } = contextRegistry.create(name as ContextKey, value);

  return <Provider value={value}>{children}</Provider>;
}
