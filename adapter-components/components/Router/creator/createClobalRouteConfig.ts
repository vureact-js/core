import type { RouteObject } from 'react-router-dom';
import type { RouteConfig } from './createRouter';

export interface GlobalRouteConfig {
  source: RouteConfig[];
  converted: RouteObject[];
}

export const _ROUTE_CONFIG_: GlobalRouteConfig = { source: [], converted: [] };

export function registerRouteConfig(routes: RouteConfig[], convertedRoutes: RouteObject[]) {
  _ROUTE_CONFIG_.source = routes;
  _ROUTE_CONFIG_.converted = convertedRoutes;
}

export function resetRouteConfig() {
  _ROUTE_CONFIG_.source = [];
  _ROUTE_CONFIG_.converted = [];
}
