import { createContext, ReactNode, useContext } from 'react';
import type { GuardManagerImpl } from '../guards/guardManager';

interface RouterContextType {
  guardManager: GuardManagerImpl;
}

const RouterContext = createContext<RouterContextType | null>(null);

interface RouterProviderProps {
  guardManager: GuardManagerImpl;
  children: ReactNode;
}

export function RouterContextProvider({ guardManager, children }: RouterProviderProps) {
  return <RouterContext.Provider value={{ guardManager }}>{children}</RouterContext.Provider>;
}

export const useRouterContext = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouterContext must be used within a RouterContextProvider');
  }
  return context;
};
