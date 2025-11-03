import { createElement, FunctionComponent, JSX, memo, ReactNode, useMemo } from 'react';
import { getReactType } from 'utils';

interface ComponentProps {
  /**
   * It can pass tag names, component functions, and JSX elements.
   */
  is: string | ReactNode | JSX.Element;
  /**
   * The props passed to the element
   */
  props?: object | null;
}

type ReturnType = JSX.Element | null;

export default memo(VueComponent);

/**
 * Equivalent to Vue dynamic component, with the same usage.
 */
function VueComponent({ is, props }: ComponentProps): ReturnType {
  const renderElement = useMemo(() => {
    switch (getReactType(is)) {
      case 'text':
        return createElement(is as string, props);

      case 'element':
        // 传入 JSX 元素 (<CompA />) 直接返回
        return is;

      case 'component':
        // 传入组件函数 (CompA)
        return createElement(is as unknown as FunctionComponent, props);

      default:
        // is 可能是 null, undefined 或其他类型
        console.error(
          `[Component error] Invalid 'is' prop value or missing component type. -->${is}`,
        );
        return null;
    }
  }, [is, props]) as ReturnType;

  return renderElement;
}
