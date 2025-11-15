import { type FC, type PropsWithChildren, type ReactNode } from 'react';
import type { RouterProviderProps } from 'react-router-dom';
import { RouterProvider as ReactRouterProvider } from 'react-router-dom';
import { RouterContextProvider } from '../context/RouterContext';
import { GuardManagerImpl } from '../guards/GuardManager';

type ReturnValues = {
  guardManager: GuardManagerImpl;
  RouterProvider: FC<{
    children?: ReactNode | undefined;
  }>;
};

/**
 * 创建集成的 `react-router-dom` RouterProvider
 * @param router 路由配置
 * @returns ReturnValues
 */
export function createRouterProvider(router: RouterProviderProps['router']): ReturnValues {
  const guardManager = new GuardManagerImpl();
  const RouterProvider: React.FC<PropsWithChildren> = ({ children }) => {
    return (
      <RouterContextProvider {...{ guardManager }}>
        <ReactRouterProvider {...{ router }} />
        {children}
      </RouterContextProvider>
    );
  };
  return { guardManager, RouterProvider };
}
