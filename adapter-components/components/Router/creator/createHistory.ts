import {
  type MemoryRouterOpts,
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
} from 'react-router-dom';
import { type ReactRoute } from './createRouter';

export type RouterMode = 'hash' | 'history' | 'memoryHistory';

export function routerFactory(mode: RouterMode, routes: ReactRoute[], opts?: MemoryRouterOpts) {
  switch (mode) {
    case 'hash':
      return createHashRouter(routes);

    case 'history':
      return createBrowserRouter(routes);

    case 'memoryHistory':
      return createMemoryRouter(routes, opts);
  }
}

export function createWebHistory(): RouterMode {
  return 'history';
}

export function createWebHashHistory(): RouterMode {
  return 'hash';
}

export function createMemoryHistory(): RouterMode {
  return 'memoryHistory';
}
