import { useContext } from 'react';
import { ContextKey, contextRegistry } from './registry';

export function useCxtValue<T>(name: ContextKey): T | undefined {
  const Context = contextRegistry.getContext<T>(name);

  if (!Context) {
    console.error(
      `[useCxtValue] Context with name "${String(name)}" not found. Did you forget to add <CtxProvider>?`,
    );
    return;
  }

  return useContext(Context);
}
