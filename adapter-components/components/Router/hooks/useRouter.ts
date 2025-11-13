import { useCallback, useMemo } from 'react';
import { type NavigateOptions, type Params, useLocation, useNavigate } from 'react-router-dom';
import { buildPathWithParams, getPathByName } from '../utils';

export interface Router {
  push: (to: string | RouterOptions) => void;
  replace: (to: string | RouterOptions) => void;
  go: (delta: number) => void;
  back: () => void;
  forward: () => void;
  current: string;
}

export interface RouterOptions {
  path?: string;
  name?: string;
  params?: Params;
  replace?: boolean;
  state?: any;
  hash?: string;
  query?: Record<string, string>;
}

/**
 * Simulate Vue's `useRouter`, based on `react-router-dom`.
 */
export function useRouter(): Router {
  const navigate = useNavigate();
  const location = useLocation();

  const buildPath = useCallback((to: string | RouterOptions): string => {
    if (typeof to === 'string') {
      return to;
    }

    let { path, query, hash, params, name } = to;

    if (name) {
      path = getPathByName(name, params);
    } else if (params && path) {
      path = buildPathWithParams(path, params);
    }

    if (query && Object.keys(query).length) {
      const searchParams = new URLSearchParams(query);
      path += `?${searchParams.toString()}`;
    }

    if (hash) {
      path += hash.startsWith('#') ? hash : `#${hash}`;
    }

    return path!;
  }, []);

  const getNavigateOptions = useCallback(
    (to: string | RouterOptions): NavigateOptions | undefined => {
      if (typeof to === 'string') return undefined;
      const { state, replace } = to;
      return { state, replace };
    },
    [],
  );

  const router = useMemo<Router>(
    () => ({
      push: (to) => {
        navigate(buildPath(to), getNavigateOptions(to));
      },

      replace: (to) => {
        navigate(buildPath(to), getNavigateOptions(to));
      },

      go: (delta) => {
        navigate(delta);
      },

      back: () => {
        navigate(-1);
      },

      forward: () => {
        navigate(1);
      },

      current: location.pathname + location.search + location.hash,
    }),
    [location.pathname, location.search, location.hash, buildPath, getNavigateOptions, navigate],
  );

  return router;
}
