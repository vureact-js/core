import { useCallback, useMemo } from 'react';
import { type NavigateOptions, type Params, useLocation, useNavigate } from 'react-router-dom';
import { buildFullPath } from '../utils';

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
        navigate(buildFullPath(to), getNavigateOptions(to));
      },

      replace: (to) => {
        navigate(buildFullPath(to), getNavigateOptions(to));
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
    [location.pathname, location.search, location.hash, getNavigateOptions, navigate],
  );

  return router;
}
