import { memo, type ReactNode } from 'react';
import { useOutlet } from 'react-router-dom';

export interface RouterViewProps {
  customRender?: (component?: ReactNode) => ReactNode;
}

export default memo(RouterView);

function RouterView({ customRender }: RouterViewProps) {
  const outlet = useOutlet();

  if (customRender) {
    return customRender(outlet);
  }

  return outlet;
}
