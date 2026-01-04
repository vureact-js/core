import { PropsWithChildren } from 'react';
import { ContextKey, contextRegistry } from './registry';

export interface CtxProviderProps<T, K> extends PropsWithChildren {
  name: K;
  value: T;
}

export function CtxProvider<T, K = ContextKey>(props: CtxProviderProps<T, K>) {
  const { name, value, children } = props;
  const { Provider } = contextRegistry.create(name as ContextKey, value);

  return <Provider value={value}>{children}</Provider>;
}
