import type { FunctionComponent, ReactNode } from 'react';
import type { RouteObject, RouterProviderProps, To } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { createRouterProvider } from '../creator/createRouterProvider';
import { type GlobalGuards } from '../guards/GuardManager';
import type { RouterOptions as RouterHookOptions } from '../hooks/useRouter';
import { buildSearchParams, resolvedPath } from '../utils';
import { registerRouteConfig, resetRouteConfig } from './createClobalRouteConfig';
import { createWebHashHistory, routerFactory, type RouterMode } from './createHistory';

export interface CreateRouterOptions {
  routes: RouteConfig[];
  history?: RouterMode;
  initialEntries?: string[];
  initialIndex?: number;
}

export interface RouteConfig {
  path: string;
  name?: string;
  state?: any;
  sensitive?: boolean;
  component?: ReactNode;
  children?: RouteConfig[];
  meta?: Record<string, any>;
  linkActiveClass?: string;
  linkExactActiveClass?: string;
  redirect?: Redirect | RedirectFunc;
}

type RedirectFunc = (to: string) => Redirect;

type Redirect = string | RedirectOptions;

type RedirectOptions = RouterHookOptions;

export interface RouterInstance extends GlobalGuards {
  router: RouterProviderProps['router'];
  RouterProvider: FunctionComponent;
  clearAll: () => void;
}

export type ReactRoute = RouteObject;

/**
 * Simulate Vue's `createRouter` based on `react-router-dom`
 *
 * @public
 *
 * @category options
 *
 * @param history Call these three functions: createWebHistory, createWebHashHistory, and createMemoryHistory to use different history modes.
 *
 * @param routes route configuration list
 *
 * @param initialEntries Initial history stack. The default value is ['/'].
 *
 * @param initialIndex Specify which entry in the `initialEntries` array is initially active, with a default value of 0.
 *
 * @returns router instance
 */
export function createRouter(options: CreateRouterOptions): RouterInstance {
  const { history = createWebHashHistory(), routes, ...memoryRouterOpts } = options;

  const convertedRoutes: ReactRoute[] = [];

  const handleRedirect = (path: string, redirect: RouteConfig['redirect']): ReactNode => {
    if (typeof redirect === 'function') {
      const redirectResult = redirect(path);
      return handleRedirect(path, redirectResult);
    }

    if (typeof redirect === 'string') {
      return <Navigate to={redirect} replace />;
    }

    if (typeof redirect === 'object') {
      const to: To = {
        hash: redirect.hash,
        pathname: resolvedPath(redirect),
        search: buildSearchParams(redirect.query),
      };

      return <Navigate to={to} state={redirect.state} replace />;
    }

    return null;
  };

  const handleLinkClasses = (route: RouteConfig) => {
    // 这些配置会在 RouterLink 组件中使用
    // 这里只做存储，不进行实际处理
    return {
      linkActiveClass: route.linkActiveClass,
      linkExactActiveClass: route.linkExactActiveClass,
    };
  };

  const handleMeta = (route: RouteConfig) => {
    // meta 数据存储在全局配置中，供路由守卫等高级特性使用
    // 这里不做具体处理，只确保配置被正确存储
    return route.meta;
  };

  const convertRoute = (route: RouteConfig): ReactRoute => {
    const reactRoute: ReactRoute = {
      path: route.path,
      id: route.name,
      element: route.component,
      caseSensitive: route.sensitive,
      children: route.children?.map(convertRoute),
    };

    // 处理重定向（优先级最高）
    if (route.redirect) {
      const redirectElement = handleRedirect(route.path, route.redirect);
      if (redirectElement) {
        reactRoute.element = redirectElement;
      }
    }

    // 这些配置会被存储在全局配置中

    handleMeta(route);
    handleLinkClasses(route);

    return reactRoute;
  };

  routes.forEach((route) => {
    // 转换主路由
    const mainRoute = convertRoute(route);
    convertedRoutes.push(mainRoute);
  });

  registerRouteConfig(routes, convertedRoutes);

  const router = routerFactory(history, convertedRoutes, memoryRouterOpts);

  const { guardManager, RouterProvider } = createRouterProvider(router);

  const clearAll = () => {
    resetRouteConfig();
    guardManager.clear();
    routes.length = 0;
  };

  return {
    router,
    clearAll,
    RouterProvider,
    beforeEach(guard) {
      guardManager.registerGuard('beforeEachGuards', guard);
    },
    beforeResolve(guard) {
      guardManager.registerGuard('beforeResolveGuards', guard);
    },
    afterEach(guard) {
      guardManager.registerGuard('afterEachGuards', guard);
    },
  };
}
