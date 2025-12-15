import { type FunctionComponent, type ReactNode } from 'react';
import type { DataRouter, NonIndexRouteObject, RouteObject, To } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { isPromise } from '../../../utils';
import { createRouterProvider } from '../creator/createRouterProvider';
import { type ExclusiveGuards, type GlobalGuards } from '../guards/GuardManager';
import type { RouterOptions as RouterHookOptions } from '../hooks/useRouter';
import { buildSearchParams, getRouteConfig, resolvedPath } from '../utils';
import { createAsyncElement, type ComponentLoader } from './createAsyncElement';
import {
  registerRouteConfig,
  resetRouteConfig,
  type GlobalRouteConfig,
} from './createClobalRouteConfig';
import { createWebHashHistory, routerFactory, type RouterMode } from './createHistory';

export interface CreateRouterOptions {
  routes: RouteConfig[];
  history?: RouterMode;
  initialEntries?: string[];
  initialIndex?: number;
}

export interface RouteConfig extends ExclusiveGuards {
  path?: string;
  name?: string;
  state?: any;
  sensitive?: boolean;
  component?: ComponentType;
  children?: RouteConfig[];
  linkActiveClassName?: string;
  linkInActiveClassName?: string;
  linkExactActiveClassName?: string;
  redirect?: Redirect | RedirectFunc;
  loader?: NonIndexRouteObject['loader'];
  meta?: { [x: string]: any; loadingComponent?: ReactNode };
}

type ComponentType = ReactNode | ComponentLoader;

type RedirectFunc = (to: RouteConfig) => Redirect;

type Redirect = string | RedirectOptions;

type RedirectOptions = RouterHookOptions;

export interface RouterInstance extends GlobalGuards {
  /**
   * A Router instance manages all navigation and data loading/mutations
   */
  router: DataRouter;
  /**
   * Render the UI for the given DataRouter. This component should
   * typically be at the top of an app's element tree.
   *
   * ```tsx
   * import { createRouter, createWebHistory } from "react-vue3-components";
   * import { createRoot } from "react-dom/client";
   *
   * const { RouterProvider } = createRouter({
   *   history: createWebHistory(),
   *   routes: []
   * });
   * createRoot(document.getElementById("root")).render(
   *   <RouterProvider />
   * );
   * ```
   * @returns React element for the rendered router
   */
  RouterProvider: FunctionComponent;
  clearAll: () => void;
  getRoutes: () => Readonly<GlobalRouteConfig>;
}

export type ReactRoute = RouteObject;

/**
 * Simulate Vue's `createRouter` based on `react-router-dom`
 *
 * @see https://react-vue3-components.vercel.app/en/router/guide
 * 
 * @param {CreateRouterOptions} options Application routes
 * @param {CreateRouterOptions.routes} options.routes n/a
 * @param {CreateRouterOptions.history} options.history n/a
 * @param {CreateRouterOptions.initialEntries} options.initialEntries n/a
 * @param {CreateRouterOptions.initialIndex} options.initialIndex n/a
 *
 * @returns {RouterInstance} Includes the route instance, RouterProvider, and so on.
 *
 * @field `RouterInstance.router` An initialized DataRouter data router
 * @field `RouterInstance.RouterProvider` Use the component directly without passing in DataRouter data router.
 */
export function createRouter(options: CreateRouterOptions): RouterInstance {
  const { history = createWebHashHistory(), routes, ...memoryRouterOpts } = options;

  const convertedRoutes: ReactRoute[] = [];

  const handleElement = ({ component, meta }: RouteConfig): ReactNode => {
    if (typeof component === 'function') {
      try {
        // 尝试执行函数，检查返回值是否为 Promise
        if (isPromise(component())) {
          return createAsyncElement(component as ComponentLoader, meta?.loadingComponent);
        }
      } catch (error) {
        console.error('[Router] Invalid component loader:', error);
      }
    }
    return component as ReactNode;
  };

  const handleRedirect = (to: RouteConfig, redirect: RouteConfig['redirect']): ReactNode => {
    if (typeof redirect === 'function') {
      const redirectResult = redirect(to);
      return handleRedirect(to, redirectResult);
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
      linkActiveClassName: route.linkActiveClassName,
      linkExactActiveClassName: route.linkExactActiveClassName,
      linkInActiveClassName: route.linkInActiveClassName,
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
      loader: route.loader,
      element: handleElement(route),
      caseSensitive: route.sensitive,
      children: route.children?.map(convertRoute),
    };

    // 处理重定向（优先级最高）
    if (route.redirect) {
      const redirectElement = handleRedirect(route, route.redirect);
      reactRoute.element = (
        <>
          {redirectElement}
          {reactRoute.element}
        </>
      );
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
    getRoutes: getRouteConfig,
  };
}
