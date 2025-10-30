import { createElement, FunctionComponent, JSX, memo, ReactNode } from 'react';
import { getReactType } from 'utils';

interface EddieComponentProps {
  is: string | ReactNode | JSX.Element;
  /**
   * The props passed to the element
   */
  props?: object | null;
}

type ReturnType = JSX.Element | null;

export default memo(EddieComponent);

/**
 * Dynamic components, similar to Vue's `<component :is="component">`
 */
function EddieComponent({ is, props }: EddieComponentProps): ReturnType {
  const renderElement = () => {
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
          `[EddieComponent error] Invalid 'is' prop value or missing component type. -->${is}`,
        );
        return null;
    }
  };

  return renderElement() as ReturnType;
}
