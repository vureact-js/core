import { memo, useEffect, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

export interface TeleportProps {
  /**
   * 目标容器选择器或目标元素。
   */
  to: string | HTMLElement;
  /**
   * true 时禁用传送并原地渲染。
   */
  disabled?: boolean;
  /**
   * true 时延迟到挂载后再执行传送。
   */
  defer?: boolean;
}

/**
 * React adapter for Vue's built-in component `<teleport>`.
 * @see https://vureact-runtime.vercel.app/guide/components/teleport
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
