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
 * Provides a value to the context registry for consumption by `useCtx`.
 *
 * @param props - Component props
 * @param props.name - Context identifier
 * @param props.value - Value to provide
 * @param props.children - Children with context access
 *
 * @returns React Provider component
 *
 * @example
 *
 * <CtxProvider name="theme" value="dark">
 *   <ChildComponent />
 * </CtxProvider>
 *
 * @see https://vureact.vercel.app/en/adapter-components/context-provider
 */
export function CtxProvider<T, K = ContextKey>(props: CtxProviderProps<T, K>) {
  const { name, value, children } = props;
  const { Provider } = contextRegistry.create(name as ContextKey, value);

  return <Provider value={value}>{children}</Provider>;
}
