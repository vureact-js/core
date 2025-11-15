import { memo, useCallback, type ReactNode } from 'react';
import { useOutlet } from 'react-router-dom';
import { GuardExecutor } from '../guards/GuardExecutor';
import { useRoute } from '../hooks/useRoute';

export interface RouterViewProps {
  customRender?: (component?: ReactNode) => ReactNode;
}

export default memo(RouterView);

function RouterView({ customRender }: RouterViewProps): ReactNode {
  const outlet = useOutlet();
  const route = useRoute();

  const render = useCallback(
    (outlet: ReactNode) => customRender?.(outlet) ?? outlet,
    [customRender],
  );

  return <GuardExecutor {...{ route, outlet, render }} />;
}
