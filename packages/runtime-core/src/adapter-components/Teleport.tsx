import { memo, useEffect, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

export interface TeleportProps {
  /**
   * Target container selector or element.
   */
  to: string | HTMLElement;
  /**
   * Render in-place when true.
   */
  disabled?: boolean;
  /**
   * Delay rendering until mounted.
   */
  defer?: boolean;
}

/**
 * React adapter for Vue's built-in component `<teleport>`.
 */
export const Teleport = memo((props: PropsWithChildren<TeleportProps>) => {
  const { to, disabled, defer, children } = props;

  const [container, setContainer] = useState<Element | null>(null);
  const [shouldRender, setShouldRender] = useState(!defer);

  useEffect(() => {
    const el = typeof to === 'string' ? document.querySelector(to) : to;

    if (!el) {
      setContainer(null);

      if (typeof to === 'string') {
        // eslint-disable-next-line no-console
        console.error(
          `[Teleport error] Please check if the selector passed to prop 'to' is correct; Guess '.${to}' or '#${to}'?`,
        );
      }

      return;
    }

    setContainer(el);
  }, [to]);

  useEffect(() => {
    if (!defer) {
      setShouldRender(true);
      return;
    }

    setShouldRender(false);
    setShouldRender(true);
  }, [defer, to]);

  if (!container || disabled) {
    return <>{children}</>;
  }

  if (!shouldRender) {
    return null;
  }

  return createPortal(children, container);
});
