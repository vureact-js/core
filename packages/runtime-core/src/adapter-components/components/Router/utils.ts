import { matchPath, type Params } from 'react-router-dom';
import { _ROUTE_CONFIG_, type GlobalRouteConfig } from './creator/createClobalRouteConfig';
import type { RouteConfig } from './creator/createRouter';
import { type RouterOptions as RouterHookOptions } from './hooks/useRouter';

export const buildFullPath = (to: string | RouterHookOptions): string => {
  if (typeof to === 'string') {
    return to;
  }

  const { query, hash } = to;

  return (
    resolvedPath(to) +
    (buildSearchParams(query) ?? '') +
    (hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '')
  );
};

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

  return buildPathWithParams(route.path!, params);
}

/**
 * Get the original route (not the converted React Router route)
 * @param path The actual route path of the navigation change
 */
export function getRouteByPath(path: string): RouteConfig | null {
  const findRouteByPath = (routes: RouteConfig[], basePath = ''): RouteConfig | null => {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }

      // 构建完整路径，处理嵌套路由
      let fullPath = route.path;
      if (basePath && route.path) {
        // 确保路径拼接正确
        if (basePath.endsWith('/') && route.path.startsWith('/')) {
          fullPath = basePath + route.path.slice(1);
        } else if (!basePath.endsWith('/') && !route.path.startsWith('/')) {
          fullPath = basePath + '/' + route.path;
        } else {
          fullPath = basePath + route.path;
        }
      } else if (basePath) {
        fullPath = basePath;
      }

      // 使用 matchPath 进行动态匹配，允许部分匹配
      const match = matchPath(
        {
          path: fullPath!,
          caseSensitive: route.sensitive,
          end: false, // 改为 false 允许部分匹配，这样父级路由也能匹配到
        },
        path,
      );

      if (match && match.pathname === path) {
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
