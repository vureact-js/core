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
        // 如果提供了 path，params 会被忽略
        if (typeof to === 'object' && to.path && to.params) {
          to.params = undefined;
        }
        return navigate(buildFullPath(to), getNavigateOptions(to));
      },

      replace: (to) => {
        if (typeof to === 'object' && to.path && to.params) {
          to.params = undefined;
        }
        return navigate(buildFullPath(to), getNavigateOptions(to));
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
    [location.pathname, location.search, location.hash, getNavigateOptions, navigate],
  );

  return router;
}
