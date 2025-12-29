import { memo, useCallback, type ReactNode } from 'react';
import { useOutlet } from 'react-router-dom';
import { GuardExecutor } from '../guards/GuardExecutor';
import { RouteLocation, useRoute } from '../hooks/useRoute';

export interface RouterViewProps {
  // customRender 可以接收可选的 route 参数（守卫执行后的 route）
  customRender?: (component: ReactNode, route: RouteLocation) => ReactNode;
}

export default memo(RouterView);

/**
 * used to render route components, based on `react-router-dom`.
 *
 * @see https://react-vue3-components.vercel.app/en/router/router-view-custom
 * 
 * @param customRender customize the display mode of route components after rendering.
 */
function RouterView({ customRender }: RouterViewProps): ReactNode {
  const outlet = useOutlet();
  const route = useRoute();

  const render = useCallback(
    (outlet: ReactNode, finalRoute: RouteLocation) => customRender?.(outlet, finalRoute) ?? outlet,
    [customRender],
  );

  return <GuardExecutor {...{ route, outlet, render }} />;
}
