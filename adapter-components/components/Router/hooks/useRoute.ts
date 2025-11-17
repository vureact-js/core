import { useMemo } from 'react';
import { type Params, useLocation, useMatches, useParams } from 'react-router-dom';
import { getRouteByPath } from '../utils';

export interface RouteLocation {
  name: string;
  path: string;
  params: Params;
  hash: string;
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
 * @returns object
 *
 * @param name
 * @param path
 * @param params
 * @param hash
 * @param state
 * @param fullPath
 * @param query
 * @param matched
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

  return {
    name,
    path: pathname,
    params,
    query,
    hash,
    state,
    fullPath,
    matched,
  };
}
