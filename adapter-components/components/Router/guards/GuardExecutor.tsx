import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuardManager } from '../hooks/useGuardManager';
import { type RouteLocation } from '../hooks/useRoute';
import { getRouteByPath } from '../utils';

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
    const createLocationWithMeta = (obj: RouteLocation) => ({
      ...obj,
      meta: getRouteByPath(obj.path)?.meta,
    });

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

      const to = createLocationWithMeta(toRoute);
      const from = createLocationWithMeta(fromRoute);

      try {
        // 执行 beforeEach 守卫
        const result = await guardManager.runBeforeEach(to, from);

        // 守卫通过，更新 outlet 并执行 afterEach
        if (result === true) {
          setCurrentOutlet(outlet);
          prevRouteRef.current = to;
          guardManager.runAfterEach(to, from);
        }

        // 重定向到路径字符串
        else if (typeof result === 'string') {
          navigate(result, { replace: true });
        }

        // 重定向到 RouteLocation 对象
        else if (result && typeof result === 'object' && 'path' in result) {
          navigate(result.fullPath!, {
            replace: true,
            state: result.state,
          });
        }

        // 如果返回 false，阻止导航（不更新 outlet）
        else if (result === false) {
          navigate(from.fullPath, { replace: true });
        }
      } catch (error) {
        // 出错时也更新位置，避免阻塞后续导航
        setCurrentOutlet(outlet);
        prevRouteRef.current = to;
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
