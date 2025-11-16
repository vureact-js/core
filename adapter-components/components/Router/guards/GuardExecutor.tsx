import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuardManager } from '../hooks/useGuardManager';
import { type RouteLocation } from '../hooks/useRoute';
import { buildFullPath, getRouteByPath } from '../utils';
import { type GuardRouteLocation } from './GuardManager';

interface Props {
  outlet: ReactNode;
  route: RouteLocation;
  render: (outlet: ReactNode) => ReactNode;
}

export function GuardExecutor({ render, outlet, route }: Props) {
  const navigate = useNavigate();
  const guardManager = useGuardManager();

  const prevRouteRef = useRef(route);

  const [isNavigating, setIsNavigating] = useState(false);
  const [currentOutlet, setCurrentOutlet] = useState(outlet);

  useEffect(() => {
    const createGuardRouteLocation = (obj: RouteLocation): GuardRouteLocation => ({
      ...obj,
      meta: getRouteByPath(obj.path)?.meta || {},
    });

    const handleGuardResult = (result: any, from: GuardRouteLocation) => {
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
    };

    const updateView = (to: GuardRouteLocation) => {
      setCurrentOutlet(outlet);
      prevRouteRef.current = to;
    };

    const executeNavigationGuards = async () => {
      const toRoute = route;
      const fromRoute = prevRouteRef.current;

      // 如果路径没有变化，不执行守卫
      if (fromRoute.path === toRoute.path) return;

      if (!toRoute || !fromRoute) {
        setCurrentOutlet(outlet);
        prevRouteRef.current = toRoute;

        console.error(
          '[Router] Could not find route configuration for path:',
          fromRoute.path,
          toRoute.path,
        );
        return;
      }

      if (isNavigating) return;

      setIsNavigating(true);

      const to = createGuardRouteLocation(toRoute);
      const from = createGuardRouteLocation(fromRoute);

      try {
        // 1. 执行 beforeEach 守卫
        const beforeEachResult = await guardManager.runBeforeEach(to, from);
        if (beforeEachResult !== true) {
          handleGuardResult(beforeEachResult, from);
          return;
        }

        // 2. 执行 beforeResolve 守卫
        const beforeResolveResult = await guardManager.runBeforeResolve(to, from);
        if (beforeResolveResult !== true) {
          handleGuardResult(beforeResolveResult, from);
          return;
        }

        // 3. 所有守卫通过，更新视图并执行 afterEach
        updateView(to);
        guardManager.runAfterEach(to, from);
      } catch (error) {
        // 出错时也更新位置，避免阻塞后续导航
        updateView(to);
        console.error('[Router] Error in navigation guards:', error);
      } finally {
        setIsNavigating(false);
      }
    };

    executeNavigationGuards();
  }, [
    outlet,
    navigate,
    guardManager,
    isNavigating,
    route.query,
    route.params,
    route.hash,
    route.state,
    route.path,
    route,
  ]);

  return useMemo(() => render(currentOutlet), [currentOutlet, render]);
}
