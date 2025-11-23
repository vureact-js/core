import {
  Children,
  HTMLAttributes,
  HTMLElementType,
  memo,
  PropsWithChildren,
  ReactElement,
  useMemo,
} from 'react';
import { TransitionGroup as ReactTransitionGroup } from 'react-transition-group';
import { BaseTransitionProps, useTransitionConfig } from '../hooks/useTransitionConfig';
import Transition from './Transition';

export interface TransitionGroupProps extends Omit<BaseTransitionProps, 'mode'> {
  /**
   * By default, it will render a div as the container,
   * which can be customized using this prop.
   */
  tag?: HTMLElementType | null;
  /**
   * Used to add HTML attributes to the DOM container
   */
  htmlProps?: HTMLAttributes<HTMLElement>;
}

export default memo(TransitionGroup);

function TransitionGroup(props: PropsWithChildren<TransitionGroupProps>) {
  const { children, htmlProps, tag = null, ...transitionProps } = props;

  const transitionConfig = useTransitionConfig(transitionProps);

  const hasTransition = useMemo(() => transitionProps.css !== false, [transitionProps.css]);

  const renderChildren = useMemo(() => {
    return Children.map(children, (child, index) => {
      const key = (child as ReactElement)?.key ?? `tg-${index}`;
      return hasTransition ? (
        <Transition show key={key} {...transitionConfig} __USE_THE_CONFIGURED_PROPS>
          {child}
        </Transition>
      ) : (
        child
      );
    });
  }, [children, hasTransition, transitionConfig]);

  const transitionGroupProps = useMemo(
    () => ({
      component: tag as 'div',
      appear: transitionConfig.appear,
      enter: transitionConfig.enter,
      exit: transitionConfig.exit,
      ...htmlProps,
    }),
    [htmlProps, tag, transitionConfig.appear, transitionConfig.enter, transitionConfig.exit],
  );

  return <ReactTransitionGroup {...transitionGroupProps}>{renderChildren}</ReactTransitionGroup>;
}
