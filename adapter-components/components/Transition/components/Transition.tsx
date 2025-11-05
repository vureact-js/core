import { Children, memo, PropsWithChildren, ReactElement, useEffect, useMemo, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import {
  BaseTransitionProps,
  getActualDuration,
  useTransitionConfig,
} from '../hooks/useTransitionConfig';
import './css/eddie-transition.css';

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
    transitionStateRef,
  ]);

  const transitionElement = useMemo(() => {
    return <CSSTransition {...cssTransitionProps}>{child}</CSSTransition>;
  }, [cssTransitionProps, child]);

  if (mode) {
    return <SwitchTransition mode={mode}>{transitionElement}</SwitchTransition>;
  }

  return transitionElement;
}
