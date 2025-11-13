import { type Params, matchPath } from 'react-router-dom';
import type { GlobalRouteConfig, RouteConfig } from './creator/createRouter';
import { _ROUTE_CONFIG_ } from './creator/createRouter';
import { type RouterOptions as RouterHookOptions } from './hooks/useRouter';

export function resolvedPath({ name, path, params }: RouterHookOptions): string {
  return name ? getPathByName(name, params) : buildPathWithParams(path!, params);
}

export function buildPathWithParams(path: string, params?: Params): string {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }

  let finalPath = path;
  const paramMatches = path.match(/:\w+/g) || [];

  // 如果有参数占位符，进行精确替换
  if (paramMatches.length > 0) {
    paramMatches.forEach((paramName) => {
      const key = paramName.slice(1); // 去掉冒号
      if (params[key]) {
        finalPath = finalPath.replace(paramName, encodeURIComponent(params[key]));
      } else {
        console.error(`[Router] Missing parameter "${key}" for path "${path}"`);
      }
    });
  } else {
    // 如果没有占位符，但提供了参数，发出警告
    console.error(
      `[Router] Path "${path}" does not contain parameter placeholders, but params were provided:`,
      params,
    );
  }

  return finalPath;
}

export function buildSearchParams(query?: Record<string, any>): string | undefined {
  return query ? `?${new URLSearchParams(query).toString()}` : undefined;
}

export function getPathByName(name?: string, params?: Params): string {
  // 递归查找路由配置（包括嵌套路由）
  const findRouteByName = (routes: RouteConfig[]): RouteConfig | null => {
    for (const route of routes) {
      if (route.name === name) {
        return route;
      }
      if (route.children) {
        const found = findRouteByName(route.children);
        if (found) return found;
      }
    }
    return null;
  };

  const route = findRouteByName(_ROUTE_CONFIG_.source);
  if (!route) {
    throw `[Router] Route with name "${name}" not found.`;
  }

  return buildPathWithParams(route.path, params);
}

export function getRouteByPath(path: string): RouteConfig | null {
  const findRouteByPath = (routes: RouteConfig[], basePath = ''): RouteConfig | null => {
    for (const route of routes) {
      const fullPath = basePath ? `${basePath}${route.path}` : route.path;

      // 使用 matchPath 进行动态匹配
      const match = matchPath({ path: fullPath, caseSensitive: route.sensitive, end: true }, path);

      if (match) {
        return route;
      }

      // 递归查询子路由
      if (route.children) {
        const found = findRouteByPath(route.children, fullPath);
        if (found) return found;
      }
    }
    return null;
  };

  return findRouteByPath(_ROUTE_CONFIG_.source);
}

export function getRouteConfig(): Readonly<GlobalRouteConfig> {
  return Object.freeze(_ROUTE_CONFIG_);
}
