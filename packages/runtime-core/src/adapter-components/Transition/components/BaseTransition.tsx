import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { CSSTransition } from 'react-transition-group';
import { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import {
  BaseTransitionProps,
  getActualDuration,
  TransitionConfig,
  useTransitionConfig,
} from '../hooks/useTransitionConfig';

export interface TransitionProps extends BaseTransitionProps {
  /**
   * Show the component; triggers the enter or exit states and
   * it will not unmount the component.
   */
  show?: boolean;
  /**
   * @private
   * Please do not use this internal prop intended for development.
   */
  __USE_THE_CONFIGURED_PROPS?: boolean;
  /**
   * @private
   * reporting animation state to the parent group.
   */
  onStateChange?: (key: string, state: TransitionState) => void;
}

export type TransitionState = 'idle' | 'entering' | 'leaving';

export default memo(BaseTransition);

/**
 * @private
 *
 * Equivalent to Vue Transition components, with the same usage.
 */
function BaseTransition(props: PropsWithChildren<TransitionProps>) {
  const {
    children,
    show,
    onEnterCancelled,
    onLeaveCancelled,
    onStateChange,
    __USE_THE_CONFIGURED_PROPS,
    ...restProps
  } = props;

  const child = Children.only(children);

  const transitionConfig = __USE_THE_CONFIGURED_PROPS
    ? (restProps as TransitionConfig)
    : useTransitionConfig(restProps);

  const prevTime = useRef(0);
  const prevShowRef = useRef(show);
  const currentNodeRef = useRef<HTMLElement>(null);
  const transitionStateRef = useRef<TransitionState>('idle');

  const originalKey = useMemo(() => (child as ReactElement).key, [child]);

  const reportState = useCallback(
    (state: TransitionState) => {
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
        // 报告状态给父组件（区分 entering / leaving / idle）
        reportState(state);
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

    return cloneElement(child, { 'data-original-key': originalKey } as any);
  }, [child, originalKey]);

  const cssTransitionProps = useMemo<CSSTransitionProps>(
    () => ({
      in: show,
      ...transitionConfig,
      ...wrappedHandlers,
      key: originalKey,
      mountOnEnter: true,
      unmountOnExit: false,
    }),
    [originalKey, show, transitionConfig, wrappedHandlers],
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
  }, [onEnterCancelled, onLeaveCancelled, restProps.duration, show]);

  // 当组件卸载时 (例如 'leave' 动画完成) 需要通知父组件不再“忙碌”
  useEffect(
    () => () => {
      reportState('idle');
    },
    [reportState],
  );

  return <CSSTransition {...cssTransitionProps}>{cloneChild}</CSSTransition>;
}
