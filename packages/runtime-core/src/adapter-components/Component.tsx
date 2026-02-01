import { ComponentType, createElement, JSX, memo, PropsWithChildren, ReactNode } from 'react';
import { getReactType } from './utils';

export interface ComponentProps extends Record<string, any> {
  /**
   * It can pass tag names, component functions, and JSX elements.
   */
  is: string | ReactNode | JSX.Element;
  /**
   * The props passed to the element
   */
}

/**
 * Equivalent to Vue dynamic component, with the same props and usage.
 *
 * @see https://vureact-runtime.vercel.app/en/components/dynamic-component
 */
export const Component = memo(
  ({ is, children, ...otherProps }: PropsWithChildren<ComponentProps>): ReactNode => {
    switch (getReactType(is)) {
      case 'text':
        return createElement(is as string, otherProps, children);

      case 'element':
        // 传入 JSX 元素 (<CompA />) 直接返回
        return is;

      case 'component':
        // 传入组件函数 (CompA)
        const Comp = is as unknown as ComponentType<object>;
        return <Comp {...otherProps}>{children}</Comp>;

      default:
        // is 可能是 null, undefined 或其他类型
        console.error(
          `[Component error] Invalid 'is' prop value or missing component type. -->${is}`,
        );
        return null;
    }
  },
);
