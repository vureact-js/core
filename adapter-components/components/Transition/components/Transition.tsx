import {
  Children,
  cloneElement,
  createRef,
  isValidElement,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import {
  BaseTransitionProps,
  getActualDuration,
  TransitionConfig,
  useTransitionConfig,
} from '../hooks/useTransitionConfig';

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
  /**
   * Please do not use this internal prop intended for development.
   * @internal
   */
  __USE_THE_CONFIGURED_PROPS?: boolean;
  /**
   * Internal prop to report animation state to the parent group.
   * @internal
   */
  onStateChange?: (key: string, state: 'idle' | 'busy') => void;
}

export default memo(Transition);

/**
 * Equivalent to  Transition components, with the same usage.
 */
function Transition(props: PropsWithChildren<TransitionProps>) {
  const {
    mode,
    children,
    show = false,
    onEnterCancelled,
    onLeaveCancelled,
    onStateChange,
    __USE_THE_CONFIGURED_PROPS,
    ...restProps
  } = props;

  const child = Children.only(children as ReactElement);

  const prevTime = useRef(0);
  const prevShowRef = useRef(show);
  const currentNodeRef = useRef<HTMLElement>(null);
  const transitionStateRef = useRef<'idle' | 'entering' | 'leaving'>('idle');

  const transitionConfig = __USE_THE_CONFIGURED_PROPS
    ? (restProps as TransitionConfig)
    : useTransitionConfig(restProps);

  const originalKey = useMemo(() => (child as any).key as string, [child]);

  const reportState = useCallback(
    (state: 'idle' | 'busy') => {
      if (originalKey) {
        onStateChange?.(originalKey, state);
      }
    },
    [originalKey, onStateChange],
  );

  const wrapHandler = useCallback(
    (handler?: (el: HTMLElement) => void, state: 'entering' | 'leaving' | 'idle' = 'idle') => {
      return (node: HTMLElement) => {
        transitionStateRef.current = state;
        currentNodeRef.current = node;

        handler?.(node);

        // 报告状态给父组件
        if (state === 'entering' || state === 'leaving') {
          reportState('busy');
        } else {
          reportState('idle');
        }
      };
    },
    [reportState],
  );

  // 包装事件处理函数，添加状态跟踪
  const wrappedHandlers = useMemo(() => {
    return {
      onEnter: wrapHandler(transitionConfig.onEnter, 'entering'),
      onEntering: wrapHandler(transitionConfig.onEntering, 'entering'),
      onEntered: wrapHandler(transitionConfig.onEntered, 'idle'),
      onExit: wrapHandler(transitionConfig.onExit, 'leaving'),
      onExiting: wrapHandler(transitionConfig.onExiting, 'leaving'),
      onExited: wrapHandler(transitionConfig.onExited, 'idle'),
    };
  }, [
    transitionConfig.onEnter,
    transitionConfig.onEntered,
    transitionConfig.onEntering,
    transitionConfig.onExit,
    transitionConfig.onExited,
    transitionConfig.onExiting,
    wrapHandler,
  ]);

  const cloneChild = useMemo(() => {
    if (!isValidElement(child)) {
      return child;
    }

    const originalRef = (child as any).ref;

    return cloneElement(child, {
      // @ts-ignore
      ref: originalRef ?? createRef(null),
      key: originalKey,
      'data-original-key': originalKey,
    }) as any;
  }, [child, originalKey]);

  const nodeRef = useMemo(() => (cloneChild as any).ref, [cloneChild]);

  const cssTransitionProps = useMemo(
    () => ({
      nodeRef,
      in: show,
      unmountOnExit: true,
      ...transitionConfig,
      ...wrappedHandlers,
      key: mode ? String(show) : originalKey,
    }),
    [mode, nodeRef, originalKey, show, transitionConfig, wrappedHandlers],
  );

  // 处理取消过渡事件
  useEffect(() => {
    // 计算两次事件触发的时间差间隔
    const timeSinceLastTransition = Date.now() - prevTime.current;

    // 根据过渡方向获取对应的 duration
    const relevantDuration =
      !show && prevShowRef.current
        ? getActualDuration(restProps.duration, 'leave') // 正在离开
        : show && !prevShowRef.current
          ? getActualDuration(restProps.duration, 'enter') // 正在进入
          : 0;

    // 触发间隔在 duration 之内
    if (timeSinceLastTransition <= relevantDuration) {
      // 当前 show 为 false （隐藏）且上一个 show 为 true （显示），且过渡状态为 leaving
      // 表明当前为隐藏状态且正在从 leaving -> entering，必须阻止它
      // 撤销 entering
      if (!show && prevShowRef.current && transitionStateRef.current === 'leaving') {
        onEnterCancelled?.(currentNodeRef.current!);
      }
      // 反之，撤销 leaving
      if (show && !prevShowRef.current && transitionStateRef.current === 'entering') {
        onLeaveCancelled?.(currentNodeRef.current!);
      }
    }

    // 只有当正常进入或离开完成时才更新旧值
    // 这里我们只在检测到取消时不更新 prevShowRef，让下一次正常过渡时再更新
    // 这样可以确保取消检测的逻辑持续有效
    if (timeSinceLastTransition > relevantDuration) {
      prevShowRef.current = show;
      prevTime.current = Date.now();
    }
  }, [
    currentNodeRef,
    restProps.duration,
    onEnterCancelled,
    onLeaveCancelled,
    prevShowRef,
    prevTime,
    show,
  ]);

  // 当组件卸载时 (例如 'leave' 动画完成) 需要通知父组件不再“忙碌”
  useEffect(() => {
    return () => {
      reportState('idle');
    };
  }, [reportState]);

  const transitionElement = useMemo(() => {
    return <CSSTransition {...cssTransitionProps}>{cloneChild}</CSSTransition>;
  }, [cssTransitionProps, cloneChild]);

  if (mode) {
    return <SwitchTransition mode={mode}>{transitionElement}</SwitchTransition>;
  }

  return transitionElement;
}
