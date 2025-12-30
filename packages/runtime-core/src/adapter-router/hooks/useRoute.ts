import { useMemo } from 'react';
import { type Params, useLocation, useMatches, useParams } from 'react-router-dom';
import { getRouteByPath } from '../utils';

export interface RouteLocation {
  name: string;
  path: string;
  params: Params;
  hash: string;
  meta: any;
  state: any;
  fullPath: string;
  query: Record<string, any>;
  matched: Array<{
    name: string;
    pathname: string;
    params: Params;
  }>;
}

/**
 * Simulate Vue's `useRoute`, based on `react-router-dom`.
 *
 * @see https://vureact.vercel.app/en/adapter-router/guide
 *
 * @returns a route object
 *
 * @field `RouteLocation.name`
 * @field `RouteLocation.path`
 * @field `RouteLocation.params`
 * @field `RouteLocation.hash`
 * @field `RouteLocation.state`
 * @field `RouteLocation.fullPath`
 * @field `RouteLocation.query`
 * @field `RouteLocation.matched`
 */
export function useRoute(): RouteLocation {
  const { hash, search, pathname, state } = useLocation();

  const params = useParams();
  const matches = useMatches();

  // 解析查询参数
  const query = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const result: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      result[key] = value;
    }
    return result;
  }, [search]);

  // 构建完整路径
  const fullPath = useMemo(() => {
    return pathname + search + hash;
  }, [pathname, search, hash]);

  const matched = matches.map(({ id, params, pathname }) => {
    return {
      name: id,
      pathname,
      params,
    };
  });

  const config = getRouteByPath(pathname);

  const name = config?.name || '';
  const meta = config?.meta || {};

  return {
    name,
    path: pathname,
    params,
    query,
    hash,
    meta,
    state,
    fullPath,
    matched,
  };
}
