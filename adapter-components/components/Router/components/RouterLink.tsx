import { memo, PropsWithChildren, useMemo } from 'react';
import {
  Link,
  useMatch,
  useNavigate,
  useResolvedPath,
  type LinkProps,
  type To,
} from 'react-router-dom';
import { type RouterOptions } from '../hooks/useRouter';
import { buildSearchParams, getRouteByPath, resolvedPath } from '../utils';

export type RouterLinkProps = Omit<LinkProps, 'to'> & RouterLinkBaseProps;

export interface RouterLinkBaseProps {
  to: string | RouterOptions;
  replace?: boolean;
  customRender?: LinkCustomRender;
  activeClass?: string;
  exactActiveClass?: string;
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
 * Simulate Vue Router's `<router-link>` component,
 * based on `react-router-dom`.
 */
function RouterLink(props: PropsWithChildren<RouterLinkProps>) {
  const {
    to,
    replace = false,
    customRender,
    children,
    activeClass,
    exactActiveClass,
    ...restProps
  } = props;

  const navLink = useMemo(() => (typeof to === 'string' ? to : ''), [to]);

  const navOptions = useMemo<To>(() => {
    let options: To & { state?: any } = {};

    if (typeof to === 'object') {
      options = {
        hash: to.hash,
        state: to.state, // 它不会传递给 <Link> 组件的 to 属性
        pathname: resolvedPath(to),
        search: buildSearchParams(to.query),
      };
    }

    return options;
  }, [to]);

  const navigate = useNavigate();
  const resolved = useResolvedPath(navLink || navOptions);

  // @ts-ignore
  const { state } = navOptions;

  // isActive/isExactActive：是计算出的状态值（在 customRender 中传递给用户）
  const isExactActive = Boolean(useMatch({ path: resolved.pathname, end: true }));
  const isActive = Boolean(useMatch({ path: resolved.pathname, end: false }));

  // 构建类名
  const className = useMemo(() => {
    const route = getRouteByPath(resolved.pathname);

    const activeCls = activeClass || route?.linkActiveClass;
    const exactActiveCls = exactActiveClass || route?.linkExactActiveClass;

    return [restProps.className, isExactActive ? exactActiveCls : '', isActive ? activeCls : '']
      .filter(Boolean)
      .join(' ');
  }, [
    activeClass,
    exactActiveClass,
    isActive,
    isExactActive,
    resolved.pathname,
    restProps.className,
  ]);

  const linkProps = useMemo(
    () => ({
      to: navLink || navOptions,
      state,
      replace,
      ...restProps,
      className,
    }),
    [className, navLink, navOptions, replace, restProps, state],
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
