import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { matchPath, useNavigate } from 'react-router-dom';
import { useGuardManager } from '../hooks/useGuardManager';
import { type RouteLocation } from '../hooks/useRoute';
import { buildFullPath, getRouteByPath } from '../utils';
import { type ExclusiveGuards, type GuardRouteLocation } from './GuardManager';

interface Props {
  outlet: ReactNode;
  route: RouteLocation;
  render: (outlet: ReactNode) => ReactNode;
}

type ParentRouteConfigs = {
  pattern: string;
  isRedirect?: boolean;
} & ExclusiveGuards;

export function GuardExecutor({ render, outlet, route }: Props) {
  const navigate = useNavigate();
  const guardManager = useGuardManager();

  const outletRef = useRef(outlet);
  const prevRouteRef = useRef(route);

  // 导航状态管理
  const navigationStateRef = useRef({
    currentPath: route.path,
    isNavigating: false,
    navigationId: 0,
  });

  const [guardApprovedOutlet, setGuardApprovedOutlet] = useState(outlet);

  const createGuardRouteLocation = (obj: RouteLocation): GuardRouteLocation => ({
    ...obj,
    meta: getRouteByPath(obj.path)?.meta || {},
  });

  // 获取所有需要检查的父级路由模式
  const getParentRouteInfo = (to: RouteLocation): ParentRouteConfigs[] => {
    const parentConfigs: ParentRouteConfigs[] = [];

    // 遍历所有匹配的路由（除了最后一个叶子路由）
    to.matched.slice(0, -1).forEach((matchedRecord) => {
      // 使用 pathname 作为模式，确保是绝对路径
      const pattern = matchedRecord.pathname;
      const routeConfig = getRouteByPath(pattern);

      if (routeConfig) {
        parentConfigs.push({
          pattern,
          beforeEnter: routeConfig.beforeEnter,
          isRedirect: !!routeConfig?.redirect,
        });
      }
    });

    return parentConfigs;
  };

  // 检查是否在同一个父级路由下导航
  const isSameParentNavigation = (
    from: RouteLocation,
    to: RouteLocation,
    parentPattern: string,
  ): boolean => {
    const absolutePattern = parentPattern.startsWith('/') ? parentPattern : `/${parentPattern}`;

    // 使用 matchPath 检查两个路由是否都匹配同一个父级模式
    const fromMatchesParent = matchPath({ path: absolutePattern, end: false }, from.path);
    const toMatchesParent = matchPath({ path: absolutePattern, end: false }, to.path);

    return !!(fromMatchesParent && toMatchesParent);
  };

  const handleGuardResult = useCallback(
    (result: any, from: GuardRouteLocation) => {
      // 重定向到路径字符串
      if (typeof result === 'string') {
        navigate(result, { replace: true });
      }
      // 重定向到 RouteLocation 对象
      else if (typeof result === 'object' && !(result instanceof Error)) {
        navigate(buildFullPath(result), {
          replace: true,
          state: result.state,
        });
      }
      // 如果返回 false，阻止导航（不更新 outlet）
      else if (result === false) {
        navigate(from.fullPath, { replace: true, state: from.state });
      }
    },
    [navigate],
  );

  // 始终保持 outletRef 为最新值
  useEffect(() => {
    outletRef.current = outlet;
  }, [outlet]);

  // 强化同步机制
  useEffect(() => {
    if (!Object.is(guardApprovedOutlet, outlet)) {
      setGuardApprovedOutlet(outlet);
    }
  }, [guardApprovedOutlet, outlet]);

  // 处理守卫逻辑
  useEffect(() => {
    let mounted = true;

    const commitView = () => {
      setGuardApprovedOutlet(outletRef.current);
      prevRouteRef.current = route;
    };

    const runGuards = async () => {
      const toRoute = route;
      const fromRoute = prevRouteRef.current;

      // 如果路径没有实际变化，不执行守卫
      if (fromRoute.path === toRoute.path) return;

      // 基于具体路径的导航状态检查
      const currentNavigationState = navigationStateRef.current;
      if (
        currentNavigationState.isNavigating &&
        currentNavigationState.currentPath === toRoute.path
      ) {
        console.log(
          'Navigation to same path already in progress, skipping.',
          `\nfrom: '${currentNavigationState.currentPath}'`,
          `\nto: '${toRoute.path}'`,
        );
        return;
      }

      // 开始新导航
      currentNavigationState.isNavigating = true;
      currentNavigationState.currentPath = toRoute.path;
      currentNavigationState.navigationId++;

      const currentNavigationId = currentNavigationState.navigationId;

      // 检查导航是否已被取消或过时
      const isNavigationInvalid = () =>
        !mounted || currentNavigationState.navigationId !== currentNavigationId;

      try {
        if (!toRoute || !fromRoute) {
          commitView();
          console.error('[Router] Could not find route configuration');
          return;
        }

        if (isNavigationInvalid()) return;

        const to = createGuardRouteLocation(toRoute);
        const from = createGuardRouteLocation(fromRoute);

        // 1. beforeEach
        const beforeEachResult = await guardManager.runBeforeEach(to, from);

        if (isNavigationInvalid()) return;

        if (beforeEachResult !== true) {
          handleGuardResult(beforeEachResult, from);
          return;
        }

        // 2. beforeEnter
        const targetRoute = getRouteByPath(to.path);
        const sourceRoute = getRouteByPath(from.path);

        const isDiffRoute =
          sourceRoute?.path !== targetRoute?.path || sourceRoute?.name !== targetRoute?.name;

        // 当目标路由不相同时且不属于跳转路由才执行 beforeEnter
        if (isDiffRoute && !targetRoute?.redirect) {
          // 2.1 处理父级路由的 beforeEnter
          if (to.matched.length > 1) {
            const parentRouteInfo = getParentRouteInfo(to);

            for (const { pattern, isRedirect, beforeEnter } of parentRouteInfo) {
              if (isNavigationInvalid()) return;

              if (isRedirect || !beforeEnter) continue;
              if (isSameParentNavigation(from, to, pattern)) continue;

              const beforeEnterResult = await guardManager.runBeforeEnter(to, from, beforeEnter);

              if (isNavigationInvalid()) return;

              if (beforeEnterResult !== true) {
                handleGuardResult(beforeEnterResult, from);
                return;
              }
            }
          }

          // 2.2 处理目标路由本身的 beforeEnter
          if (targetRoute?.beforeEnter && !isNavigationInvalid()) {
            const beforeEnterResult = await guardManager.runBeforeEnter(
              to,
              from,
              targetRoute.beforeEnter,
            );

            if (isNavigationInvalid()) return;

            if (beforeEnterResult !== true) {
              handleGuardResult(beforeEnterResult, from);
              return;
            }
          }
        }

        // 3. beforeResolve
        const beforeResolveResult = await guardManager.runBeforeResolve(to, from);

        if (isNavigationInvalid()) return;

        if (beforeResolveResult !== true) {
          handleGuardResult(beforeResolveResult, from);
          return;
        }

        if (isNavigationInvalid()) return;
        // 4. commit view and run afterEach
        commitView();
        guardManager.runAfterEach(to, from);
      } catch (err) {
        if (isNavigationInvalid()) commitView();
        console.error('[Router] Error in navigation guards:', err);
      } finally {
        if (currentNavigationState.navigationId === currentNavigationId) {
          currentNavigationState.isNavigating = false;
        }
      }
    };

    runGuards();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGuardResult, route]);

  return useMemo(() => render(guardApprovedOutlet), [guardApprovedOutlet, render]);
}
