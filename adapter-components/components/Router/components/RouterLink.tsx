import { memo, PropsWithChildren, useMemo } from 'react';
import {
  Link,
  useMatch,
  useNavigate,
  useResolvedPath,
  type LinkProps,
  type To,
} from 'react-router-dom';
import { RouteConfig } from '../creator/createRouter';
import { type RouterOptions } from '../hooks/useRouter';
import { buildSearchParams, getRouteByPath, resolvedPath } from '../utils';

export type RouterLinkProps = Omit<LinkProps, 'to'> & RouterLinkBaseProps;

export interface RouterLinkBaseProps {
  to: string | RouterOptions;
  replace?: boolean;
  customRender?: LinkCustomRender;
  inActiveClassName?: string;
  activeClassName?: string;
  exactActiveClassName?: string;
}

export type LinkCustomRender = (props: CustomRenderProps) => React.ReactNode;

export type CustomRenderProps = {
  href: string;
  isActive: boolean;
  isExactActive: boolean;
  navigate: () => void;
};

export default memo(RouterLink);

/**
 * used for navigating routes, based on `react-router-dom`.
 *
 * @param to the route address to navigate to when the link is clicked.
 * @param replace call `router.replace` to replace `router.push`
 * @param activeClassName the class is applied to the link when it matches the current route.
 * @param exactActiveClassName the class is applied to the link when it strictly matches the current route.
 * @param customRender Customize whether its content should be wrapped in an `<a>` tag
 */
function RouterLink(props: PropsWithChildren<RouterLinkProps>) {
  const {
    to,
    replace = false,
    customRender,
    children,
    activeClassName = '',
    inActiveClassName = '',
    exactActiveClassName = '',
    ...restProps
  } = props;

  const navLink = useMemo(() => (typeof to === 'string' ? to : ''), [to]);

  const navOptions = useMemo<To>(() => {
    let options: To & { state?: any } = {};

    if (typeof to === 'object') {
      const t = { ...to };

      if (t.path && t.params) {
        t.params = undefined;
      }

      options = {
        hash: t.hash,
        state: t.state, // 它不会传递给 <Link> 组件的 to 属性
        pathname: resolvedPath(t),
        search: buildSearchParams(t.query),
      };
    }

    return options;
  }, [to]);

  const navigate = useNavigate();
  const resolved = useResolvedPath(navLink || navOptions);

  const redirectOfTarget = useMemo<string | undefined>(() => {
    const targetRoute = getRouteByPath(resolved.pathname);

    if (!targetRoute) return;

    const getRedirect = (redirect: RouteConfig['redirect']) => {
      if (!redirect) return;
      if (typeof redirect === 'string') return redirect;
      if (typeof redirect === 'object') return redirect.name || redirect.path;
      if (typeof redirect === 'function') return getRedirect(redirect(targetRoute));
    };

    return getRedirect(targetRoute?.redirect);
  }, [resolved.pathname]);

  // @ts-ignore
  const { state } = navOptions;

  // isActive/isExactActive：是计算出的状态值（在 customRender 中传递给用户）
  const isExactActive = Boolean(useMatch({ path: resolved.pathname, end: true }));
  const isActive = Boolean(useMatch({ path: resolved.pathname, end: false }));

  // 构建类名
  const className = useMemo(() => {
    const route = getRouteByPath(resolved.pathname);

    const activeCls = activeClassName || route?.linkActiveClassName;
    const inActiveCls = inActiveClassName || route?.linkInActiveClassName;
    const exactActiveCls = exactActiveClassName || route?.linkExactActiveClassName;

    return [
      restProps.className,
      isExactActive ? exactActiveCls : '',
      isActive ? activeCls : '',
      !isActive && !isExactActive ? inActiveCls : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [
    activeClassName,
    exactActiveClassName,
    inActiveClassName,
    isActive,
    isExactActive,
    resolved.pathname,
    restProps.className,
  ]);

  const linkProps = useMemo(
    () => ({
      to: redirectOfTarget || navLink || navOptions,
      state,
      replace: !!redirectOfTarget || replace,
      ...restProps,
      className,
    }),
    [className, navLink, navOptions, redirectOfTarget, replace, restProps, state],
  );

  const customRenderProps = useMemo(() => {
    const href = navLink || resolved.pathname + (resolved?.search ?? '') + (resolved?.hash ?? '');
    const cb = () => navigate(navLink || navOptions, { replace });
    return {
      href,
      isActive,
      isExactActive,
      navigate: cb,
    };
  }, [navLink, resolved, isActive, isExactActive, navigate, navOptions, replace]);

  return customRender?.(customRenderProps) || <Link {...linkProps}>{children}</Link>;
}
