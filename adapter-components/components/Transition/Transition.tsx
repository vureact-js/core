import { Children, memo, PropsWithChildren, ReactElement, useMemo, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './css/eddie-transition.css';
import { useTransitionCancelled } from './hooks/useTransitionCancelled';
import { BaseTransitionProps, useTransitionConfig } from './hooks/useTransitionConfig';

export interface TransitionProps extends BaseTransitionProps {
  /**
   * Show the component; triggers the enter or exit states
   */
  show?: boolean;
  /**
   * Controls the timing sequence of leaving/entering transitions.
   * Default behavior is simultaneous.
   */
  mode?: 'in-out' | 'out-in';
}

export default memo(VueTransition);

/**
 * Equivalent to Vue Transition components, with the same usage.
 */
function VueTransition(props: PropsWithChildren<TransitionProps>) {
  const { mode, children, show = false, onEnterCancelled, onLeaveCancelled, ...restProps } = props;

  const child = Children.only(children as ReactElement);

  const prevTime = useRef(0);
  const prevShowRef = useRef(show);
  const currentNodeRef = useRef<HTMLElement>(null);
  const transitionStateRef = useRef<'idle' | 'entering' | 'leaving'>('idle');

  const transitionConfig = useTransitionConfig(restProps);

  // 包装事件处理函数，添加状态跟踪
  const wrappedHandlers = useMemo(() => {
    const wrapHandler = (
      handler?: (el: HTMLElement) => void,
      state: 'entering' | 'leaving' | 'idle' = 'idle',
    ) => {
      return (node: HTMLElement) => {
        transitionStateRef.current = state;
        currentNodeRef.current = node;
        handler?.(node);
      };
    };

    return {
      onEnter: wrapHandler(transitionConfig.onEnter, 'entering'),
      onEntering: transitionConfig.onEntering,
      onEntered: wrapHandler(transitionConfig.onEntered, 'idle'),
      onExit: wrapHandler(transitionConfig.onExit, 'leaving'),
      onExiting: transitionConfig.onExiting,
      onExited: wrapHandler(transitionConfig.onExited, 'idle'),
    };
  }, [transitionConfig]);

  const key = useMemo(() => (mode ? String(show) : child.key), [mode, show, child.key]);

  const cssTransitionProps = useMemo(
    () => ({
      key,
      in: show,
      unmountOnExit: true,
      ...transitionConfig,
      ...wrappedHandlers,
    }),
    [key, show, transitionConfig, wrappedHandlers],
  );

  useTransitionCancelled({
    show,
    prevTime,
    prevShowRef,
    currentNodeRef,
    onEnterCancelled,
    onLeaveCancelled,
    transitionStateRef,
    duration: restProps.duration,
  });

  const transitionElement = useMemo(() => {
    return <CSSTransition {...cssTransitionProps}>{child}</CSSTransition>;
  }, [cssTransitionProps, child]);

  if (mode) {
    return <SwitchTransition mode={mode}>{transitionElement}</SwitchTransition>;
  }

  return transitionElement;
}
