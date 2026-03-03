import {
  cloneElement,
  ComponentType,
  createElement,
  isValidElement,
  memo,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from 'react';
import { getReactType } from './utils';

export interface ComponentProps extends Record<string, any> {
  /**
   * 动态渲染目标。
   * 支持原生标签名、组件类型、ReactElement。
   */
  is: string | ComponentType<any> | ReactElement;
}

/**
 * React adapter for Vue's built-in component `<component>`.
 * @see https://runtime.vureact.top/guide/components/dynamic-components.html
 */
export const Component = memo(
  ({ is, children, ...otherProps }: PropsWithChildren<ComponentProps>): ReactNode => {
    switch (getReactType(is)) {
      case 'text':
        return createElement(is as string, otherProps, children);

      case 'element': {
        const element = is as ReactElement;
        const mergedChildren =
          children !== undefined ? children : (element.props as PropsWithChildren).children;

        return cloneElement(element, otherProps, mergedChildren);
      }

      case 'component':
        return createElement(is as ComponentType<any>, otherProps, children);

      default:
        if (!isValidElement(is)) {
          // eslint-disable-next-line no-console
          console.error(
            `[Component error] Invalid 'is' prop value or missing component type. -->${String(is)}`,
          );
        }
        return null;
    }
  },
);
