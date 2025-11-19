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

/**
 * Create a new DataRouter data router that manages the application
 * path via `history.pushState` and `history.replaceState`.
 *
 * @returns history route mode
 */
export function createWebHistory(): RouterMode {
  return 'history';
}

/**
 * Create a new DataRouter data router that manages the application path via the URL `hash`.
 *
 * @returns hash route mode
 */
export function createWebHashHistory(): RouterMode {
  return 'hash';
}

/**
 * Create a new DataRouter that manages the application
 * path using an in-memory `History` stack. Useful
 * for non-browser environments without a DOM API.
 *
 * @returns memory history route mode
 */
export function createMemoryHistory(): RouterMode {
  return 'memoryHistory';
}
