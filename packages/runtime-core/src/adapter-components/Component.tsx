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
   * Dynamic render target.
   */
  is: string | ComponentType<any> | ReactElement;
}

/**
 * React adapter for Vue's built-in component `<component>`.
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
