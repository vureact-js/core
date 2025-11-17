import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
} & ExclusiveGuards;

export function GuardExecutor({ render, outlet, route }: Props) {
  const navigate = useNavigate();
  const guardManager = useGuardManager();

  const outletRef = useRef(outlet);
  const prevRouteRef = useRef(route);
  const isNavigatingRef = useRef(false);

  const [guardApprovedOutlet, setGuardApprovedOutlet] = useState(outlet);

  const createGuardRouteLocation = (obj: RouteLocation): GuardRouteLocation => ({
    ...obj,
    meta: getRouteByPath(obj.path)?.meta || {},
  });

  // 获取所有需要检查的父级路由模式
  const getParentRouteConfigs = (to: RouteLocation): ParentRouteConfigs[] => {
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
    const current = guardApprovedOutlet;
    const next = outletRef.current;

    const isSame =
      current === next ||
      (isValidElement(current) &&
        isValidElement(next) &&
        current.type === next.type &&
        current.key === next.key);

    if (!isSame) {
      setGuardApprovedOutlet(next);
    }
  }, [guardApprovedOutlet]);

  // 额外防护
  useEffect(() => {
    if (!Object.is(guardApprovedOutlet, outlet)) {
      setGuardApprovedOutlet(outlet);
    }
  }, [guardApprovedOutlet, outlet]);

  // 处理守卫逻辑
  useEffect(() => {
    let mounted = true;
    let currentNavigationId: string | null = null;

    const commitView = () => {
      setGuardApprovedOutlet(outletRef.current);
      prevRouteRef.current = route;
    };

    const run = async () => {
      const toRoute = route;
      const fromRoute = prevRouteRef.current;

      // 生成唯一的导航ID
      const navigationId = `${fromRoute.path}→${toRoute.path}`;
      currentNavigationId = navigationId;

      const isNavCancelled = () => !mounted || currentNavigationId !== navigationId;

      // 如果路由没有变化，不执行守卫
      if (Object.is(fromRoute, toRoute)) {
        return;
      }

      if (isNavigatingRef.current) {
        console.warn('[Router] Navigation already in progress, skipping');
        return;
      }

      isNavigatingRef.current = true;

      try {
        const to = createGuardRouteLocation(toRoute);
        const from = createGuardRouteLocation(fromRoute);

        if (!toRoute || !fromRoute) {
          commitView();
          console.error('[Router] Could not find route configuration');
          return;
        }

        // 检查导航是否已被取消
        if (isNavCancelled()) return;

        // 1. beforeEach
        const beforeEachResult = await guardManager.runBeforeEach(to, from);
        if (isNavCancelled()) return;
        if (beforeEachResult !== true) {
          handleGuardResult(beforeEachResult, from);
          return;
        }

        // 2. beforeEnter
        const targetRoute = getRouteByPath(to.path);
        const sourceRoute = getRouteByPath(from.path);
        const isDiffRoute =
          sourceRoute?.path !== targetRoute?.path || sourceRoute?.name !== targetRoute?.name;

        if (isDiffRoute) {
          // 2.1 处理父级路由的 beforeEnter
          if (to.matched.length > 1) {
            const parentRouteConfigs = getParentRouteConfigs(to);
            for (const { pattern, beforeEnter } of parentRouteConfigs) {
              if (!beforeEnter) continue;

              // 检查导航是否已被取消
              if (isNavCancelled()) return;

              const isMovingBetweenSameParentRoutes = isSameParentNavigation(from, to, pattern);
              if (isMovingBetweenSameParentRoutes) continue;

              const beforeEnterResult = await guardManager.runBeforeEnter(to, from, beforeEnter);
              if (isNavCancelled()) return;
              if (beforeEnterResult !== true) {
                handleGuardResult(beforeEnterResult, from);
                return;
              }
            }
          }

          // 2.2 处理目标路由本身的 beforeEnter
          if (targetRoute?.beforeEnter) {
            // 检查导航是否已被取消
            if (isNavCancelled()) return;

            const beforeEnterResult = await guardManager.runBeforeEnter(
              to,
              from,
              targetRoute.beforeEnter,
            );
            if (isNavCancelled()) return;
            if (beforeEnterResult !== true) {
              handleGuardResult(beforeEnterResult, from);
              return;
            }
          }
        }

        // 3. beforeResolve
        const beforeResolveResult = await guardManager.runBeforeResolve(to, from);
        if (isNavCancelled()) return;
        if (beforeResolveResult !== true) {
          handleGuardResult(beforeResolveResult, from);
          return;
        }

        // 4. commit view and run afterEach
        if (isNavCancelled()) return;
        commitView();
        guardManager.runAfterEach(to, from);
      } catch (err) {
        if (!isNavCancelled()) {
          commitView();
        }
        console.error('[Router] Error in navigation guards:', err);
      } finally {
        if (currentNavigationId === navigationId) {
          isNavigatingRef.current = false;
        }
      }
    };

    run();

    return () => {
      mounted = false;
      currentNavigationId = null;
    };
  }, [route, guardManager, handleGuardResult]);

  return useMemo(() => render(guardApprovedOutlet), [guardApprovedOutlet, render]);
}
