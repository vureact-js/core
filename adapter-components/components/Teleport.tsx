import { memo, useEffect, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

export interface TeleportProps {
  /**
   * Required field. Specifies the target container.
   * It can be a selector or an actual element.
   */
  to: string | HTMLElement;
  /**
   * When the value is `true`, the content will remain in its original position,
   * instead of being moved to the target container.
   * It can be changed dynamically.
   */
  disabled?: boolean;
  /**
   * Delay until the current component is mounted
   */
  defer?: boolean;
}

export default memo(Teleport);

/**
 * Equivalent to  Teleport components, with the same usage.
 */
function Teleport(props: PropsWithChildren<TeleportProps>) {
  const { to, disabled, defer, children } = props;

  const [container, setContainer] = useState<Element | null>(null);
  const [shouldRender, setShouldRender] = useState(!defer);

  useEffect(() => {
    const el = typeof to === 'string' ? document.querySelector(to) : to;
    if (!el) {
      if (typeof to === 'string') {
        console.error(
          `[Teleport error] Please check if the selector passed to prop 'to' is correct; Guess '.${to}' or '#${to}'?`,
        );
      }
    } else {
      Promise.resolve().then(() => setContainer(el));
    }
  }, [to]);

  useEffect(() => {
    if (defer) {
      Promise.resolve().then(() => setShouldRender(true));
    }
  }, [defer]);

  if (!container || disabled) {
    return <>{children}</>;
  }

  if (!shouldRender) {
    return null;
  }

  return createPortal(children, container);
}
