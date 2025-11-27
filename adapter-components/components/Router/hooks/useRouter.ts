import { useCallback, useMemo } from 'react';
import { type NavigateOptions, type Params, useLocation, useNavigate } from 'react-router-dom';
import { buildFullPath } from '../utils';

export interface Router {
  push: (to: string | RouterOptions) => void | Promise<void>;
  replace: (to: string | RouterOptions) => void | Promise<void>;
  go: (delta: number) => void | Promise<void>;
  back: () => void | Promise<void>;
  forward: () => void | Promise<void>;
  current: string;
}

export interface RouterOptions extends NavigateOptions {
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
 *
 * @returns a route handler object
 *
 * @field `Router.push`
 * @field `Router.replace`
 * @field `Router.go`
 * @field `Router.back`
 * @field `Router.forward`
 * @field `Router.current`
 */
export function useRouter(): Router {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTo = useCallback(
    (to: string | RouterOptions) => {
      if (typeof to === 'object') {
        // 允许不提供 path 和 name
        if (!to.path && !to.name) {
          to.path = location.pathname;
        }

        // 如果提供了 path，params 会被忽略
        if (to.path && to.params) {
          to.params = undefined;
        }
      }

      return to;
    },
    [location.pathname],
  );

  const getNavigateOptions = useCallback(
    (to: string | RouterOptions): NavigateOptions | undefined => {
      if (typeof to === 'string') return undefined;
      return to;
    },
    [],
  );

  const router = useMemo<Router>(
    () => ({
      push: (to) => {
        return navigate(buildFullPath(handleTo(to)), getNavigateOptions(to));
      },

      replace: (to) => {
        return navigate(buildFullPath(handleTo(to)), getNavigateOptions(to));
      },

      go: (delta) => {
        return navigate(delta);
      },

      back: () => {
        return navigate(-1);
      },

      forward: () => {
        return navigate(1);
      },

      current: location.pathname + location.search + location.hash,
    }),
    [location.pathname, location.search, location.hash, navigate, handleTo, getNavigateOptions],
  );

  return router;
}
