import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { matchPath, useNavigate } from 'react-router-dom';
import { RouteConfig } from '../creator/createRouter';
import { useGuardManager } from '../hooks/useGuardManager';
import { type RouteLocation } from '../hooks/useRoute';
import { buildFullPath, getRouteByPath } from '../utils';
import { type ExclusiveGuards, type GuardRouteLocation } from './GuardManager';

interface Props {
  outlet: ReactNode;
  route: RouteLocation;
  // render 接受可选的 finalRoute 参数（守卫执行后的 route）
  render: (outlet: ReactNode, finalRoute: RouteLocation) => ReactNode;
}

type ParentRouteConfigs = {
  pattern: string;
  isRedirect?: boolean;
} & ExclusiveGuards;

/**
 * A component that handles the integration of various route guards.
 */
export function GuardExecutor({ render, outlet, route }: Props) {
  const navigate = useNavigate();
  const guardManager = useGuardManager();

  const isFristMount = useRef(true);
  const outletRef = useRef(outlet);
  const prevRouteRef = useRef(route);

  // 导航状态管理
  const navigationStateRef = useRef({
    currentPath: route.path,
    isNavigating: false,
    navigationId: 0,
  });

  const [finalRoute, setFinalRoute] = useState(route);
  const [guardApprovedOutlet, setGuardApprovedOutlet] = useState(outlet);

  const shouldTriggerBeforeEach = (
    sourceFromRoute: RouteConfig | null,
    sourceToRoute: RouteConfig | null,
  ) => {
    const isDiffRoute =
      sourceFromRoute?.path !== sourceToRoute?.path ||
      sourceFromRoute?.name !== sourceToRoute?.name;
    return isFristMount.current || isDiffRoute;
  };

  const shouldTriggerBeforeEnter = (
    sourceFromRoute: RouteConfig | null,
    sourceToRoute: RouteConfig | null,
  ) => {
    // 当目标路由不相同时且不属于跳转路由才执行 beforeEnter
    return shouldTriggerBeforeEach(sourceFromRoute, sourceToRoute) && !sourceToRoute?.redirect;
  };

  const shouldTriggerBeforeRouteUpdate = (from: RouteLocation, to: RouteLocation): boolean => {
    if (isFristMount.current) return false;
    // 检查是否有复用的组件
    const reusedComponents = getReusedComponents(from, to);
    return reusedComponents.length > 0;
  };

  const getReusedComponents = (from: RouteLocation, to: RouteLocation): string[] => {
    const reused: string[] = [];

    // 遍历匹配的路由记录
    to.matched.forEach((toMatch, index) => {
      const fromMatch = from.matched[index];

      if (fromMatch && toMatch.pathname === fromMatch.pathname) {
        // 检查路由参数是否变化
        const paramsChanged = Object.is(fromMatch.params, fromMatch.params);
        const queryChanged = fromMatch.pathname !== toMatch.pathname;

        if (paramsChanged || queryChanged) {
          reused.push(toMatch.pathname);
        }
      }
    });

    return reused;
  };

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

  // 处理守卫逻辑，依赖路由组件变化
  useEffect(() => {
    let mounted = true;

    const commitView = (currentRoute: RouteLocation) => {
      setFinalRoute(currentRoute);
      prevRouteRef.current = currentRoute;
      setGuardApprovedOutlet(outletRef.current);
    };

    // 基于具体路径的导航状态检查
    const isNavigating = (): boolean => {
      const state = navigationStateRef.current;
      return state.isNavigating && state.currentPath === route.path;
    };

    const startNewNavigationState = (): number => {
      const state = navigationStateRef.current;

      state.navigationId++;
      state.isNavigating = true;
      state.currentPath = route.path;

      return state.navigationId;
    };

    const isNavigationInvalid = (currentId: number) => {
      const state = navigationStateRef.current;
      return !mounted || state.navigationId !== currentId;
    };

    const runGuards = async () => {
      const toRoute = route;
      const fromRoute = prevRouteRef.current;

      // 如果路径没有实际变化，不执行守卫
      if (fromRoute.path === toRoute.path) return;

      if (isNavigating()) {
        // eslint-disable-next-line no-console
        console.log(
          'Navigation to same path already in progress, skipping.',
          `\nfrom: '${navigationStateRef.current.currentPath}'`,
          `\nto: '${toRoute.path}'`,
        );
        return;
      }

      const nid = startNewNavigationState();

      try {
        if (!toRoute || !fromRoute) {
          commitView(toRoute);
          console.error('[Router] Could not find route configuration');
          return;
        }

        if (isNavigationInvalid(nid)) return;

        // 1. beforeRouteLeave
        if (!isFristMount.current) {
          const beforeRouteLeaveResult = await guardManager.runBeforeRouteLeave(toRoute, fromRoute);

          if (isNavigationInvalid(nid)) return;

          if (beforeRouteLeaveResult === false) {
            handleGuardResult(beforeRouteLeaveResult, fromRoute);
            return;
          }
        }

        const sourceToRoute = getRouteByPath(toRoute.path);
        const sourceFromRoute = getRouteByPath(fromRoute.path);

        // 2. beforeEach
        if (shouldTriggerBeforeEach(sourceFromRoute, sourceToRoute)) {
          const beforeEachResult = await guardManager.runBeforeEach(toRoute, fromRoute);

          if (isNavigationInvalid(nid)) return;

          if (beforeEachResult !== true) {
            handleGuardResult(beforeEachResult, fromRoute);
            return;
          }
        }

        // 3. beforeRouteUpdate
        if (shouldTriggerBeforeRouteUpdate(fromRoute, toRoute)) {
          const beforeRouteUpdateResult = await guardManager.runBeforeRouteUpdate(
            toRoute,
            fromRoute,
          );

          if (isNavigationInvalid(nid)) return;

          if (beforeRouteUpdateResult === false) {
            handleGuardResult(beforeRouteUpdateResult, fromRoute);
            return;
          }
        }

        // 4. beforeEnter
        if (shouldTriggerBeforeEnter(sourceFromRoute, sourceToRoute)) {
          // 4.1 处理父级路由的 beforeEnter
          if (toRoute.matched.length > 1) {
            const parentRouteInfo = getParentRouteInfo(toRoute);

            for (const { pattern, isRedirect, beforeEnter } of parentRouteInfo) {
              if (isNavigationInvalid(nid)) return;

              if (isRedirect || !beforeEnter) continue;
              if (isSameParentNavigation(fromRoute, toRoute, pattern)) continue;

              const beforeEnterResult = await guardManager.runBeforeEnter(
                toRoute,
                fromRoute,
                beforeEnter,
              );

              if (isNavigationInvalid(nid)) return;

              if (beforeEnterResult !== true) {
                handleGuardResult(beforeEnterResult, fromRoute);
                return;
              }
            }
          }

          // 4.2 处理目标路由本身的 beforeEnter
          if (sourceToRoute?.beforeEnter && !isNavigationInvalid(nid)) {
            const beforeEnterResult = await guardManager.runBeforeEnter(
              toRoute,
              fromRoute,
              sourceToRoute.beforeEnter,
            );

            if (isNavigationInvalid(nid)) return;

            if (beforeEnterResult !== true) {
              handleGuardResult(beforeEnterResult, fromRoute);
              return;
            }
          }
        }

        // 5. beforeResolve
        const beforeResolveResult = await guardManager.runBeforeResolve(toRoute, fromRoute);

        if (isNavigationInvalid(nid)) return;

        if (beforeResolveResult !== true) {
          handleGuardResult(beforeResolveResult, fromRoute);
          return;
        }

        if (isNavigationInvalid(nid)) return;

        // 6. run afterEach commit view
        commitView(toRoute);
        guardManager.runAfterEach(toRoute, fromRoute);
      } catch (err) {
        if (isNavigationInvalid(nid)) commitView(toRoute);
        console.error('[Router] Error in navigation guards:', err);
      } finally {
        if (isFristMount.current) {
          isFristMount.current = false;
        }
        if (navigationStateRef.current.navigationId === nid) {
          navigationStateRef.current.isNavigating = false;
        }
      }
    };

    runGuards();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGuardResult, route]);

  return useMemo(
    () => render(guardApprovedOutlet, finalRoute),
    [finalRoute, guardApprovedOutlet, render],
  );
}
