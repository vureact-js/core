import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './css/eddie-transition.css';
import { transitionPresets } from './styles';

interface EddieTransitionProps {
  children: React.ReactElement;
  show?: boolean;
  name?: string;
  mode?: 'in-out' | 'out-in';
  duration?: number | { enter: number; leave: number };
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
  onBeforeEnter?: (el: HTMLElement) => void;
  onEnter?: (el: HTMLElement, done: () => void) => void;
  onAfterEnter?: (el: HTMLElement) => void;
  onEnterCancelled?: (el: HTMLElement) => void;
  onBeforeLeave?: (el: HTMLElement) => void;
  onLeave?: (el: HTMLElement, done: () => void) => void;
  onAfterLeave?: (el: HTMLElement) => void;
  onLeaveCancelled?: (el: HTMLElement) => void;
}

const EddieTransition: React.FC<EddieTransitionProps> = (props) => {
  const {
    children,
    show = false,
    name = 'ed',
    mode,
    duration = 340,
    enterFromClass,
    enterActiveClass,
    enterToClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
    onBeforeEnter,
    onEnter,
    onAfterEnter,
    onEnterCancelled,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
    onLeaveCancelled,
  } = props;

  // 使用 useMemo 优化类名计算
  const classNames = useMemo(() => {
    if (
      enterFromClass ||
      enterActiveClass ||
      enterToClass ||
      leaveFromClass ||
      leaveActiveClass ||
      leaveToClass
    ) {
      return {
        enter: enterFromClass || `${name}-enter-from`,
        enterActive: enterActiveClass || `${name}-enter-active`,
        enterDone: enterToClass || `${name}-enter-to`,
        exit: leaveFromClass || `${name}-leave-from`,
        exitActive: leaveActiveClass || `${name}-leave-active`,
        exitDone: leaveToClass || `${name}-leave-to`,
      };
    }

    const presetName =
      name in transitionPresets
        ? transitionPresets[name as keyof typeof transitionPresets]()
        : name;
    return {
      enter: `${presetName}-enter ${presetName}-enter-from`,
      enterActive: `${presetName}-enter-active`,
      enterDone: `${presetName}-enter-to`,
      exit: `${presetName}-exit ${presetName}-leave-from`,
      exitActive: `${presetName}-exit-active ${presetName}-leave-active`,
      exitDone: `${presetName}-exit-to ${presetName}-leave-to`,
    };
  }, [
    name,
    enterFromClass,
    enterActiveClass,
    enterToClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
  ]);

  // 使用 useMemo 优化超时时间计算
  const timeout = useMemo(() => {
    if (typeof duration === 'number') {
      return duration;
    }
    return {
      enter: duration.enter,
      exit: duration.leave,
    };
  }, [duration]);

  // 重新设计取消事件跟踪 - 基于请求ID和立即检测
  const enterRequestIdRef = useRef<number | null>(null);
  const leaveRequestIdRef = useRef<number | null>(null);
  const currentNodeRef = useRef<HTMLElement | null>(null);

  // 使用 useCallback 优化事件处理函数
  const handleEnter = useCallback(
    (node: HTMLElement) => {
      currentNodeRef.current = node;

      // 立即检查是否应该取消离开动画
      if (leaveRequestIdRef.current !== null) {
        onLeaveCancelled?.(node);
        // 取消之前的离开动画
        if (leaveRequestIdRef.current) {
          cancelAnimationFrame(leaveRequestIdRef.current);
          leaveRequestIdRef.current = null;
        }
      }

      // 标记进入开始
      enterRequestIdRef.current = requestAnimationFrame(() => {
        onBeforeEnter?.(node);
      });
    },
    [onBeforeEnter, onLeaveCancelled],
  );

  const handleEntering = useCallback(
    (node: HTMLElement) => {
      onEnter?.(node, () => {
        // 手动 done 回调
      });
    },
    [onEnter],
  );

  const handleEntered = useCallback(
    (node: HTMLElement) => {
      enterRequestIdRef.current = null;
      onAfterEnter?.(node);
    },
    [onAfterEnter],
  );

  const handleExit = useCallback(
    (node: HTMLElement) => {
      currentNodeRef.current = node;

      // 立即检查是否应该取消进入动画
      if (enterRequestIdRef.current !== null) {
        onEnterCancelled?.(node);
        // 取消之前的进入动画
        if (enterRequestIdRef.current) {
          cancelAnimationFrame(enterRequestIdRef.current);
          enterRequestIdRef.current = null;
        }
      }

      // 标记离开开始
      leaveRequestIdRef.current = requestAnimationFrame(() => {
        onBeforeLeave?.(node);
      });
    },
    [onBeforeLeave, onEnterCancelled],
  );

  const handleExiting = useCallback(
    (node: HTMLElement) => {
      onLeave?.(node, () => {
        // 手动 done 回调
      });
    },
    [onLeave],
  );

  const handleExited = useCallback(
    (node: HTMLElement) => {
      leaveRequestIdRef.current = null;
      onAfterLeave?.(node);
    },
    [onAfterLeave],
  );

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时取消所有进行中的动画
      if (enterRequestIdRef.current) {
        cancelAnimationFrame(enterRequestIdRef.current);
        enterRequestIdRef.current = null;
      }
      if (leaveRequestIdRef.current) {
        cancelAnimationFrame(leaveRequestIdRef.current);
        leaveRequestIdRef.current = null;
      }
    };
  }, []);

  // 基础 CSSTransition 配置
  const cssTransitionProps = useMemo(
    () => ({
      in: show,
      timeout,
      classNames,
      unmountOnExit: true,
      onEnter: handleEnter,
      onEntering: handleEntering,
      onEntered: handleEntered,
      onExit: handleExit,
      onExiting: handleExiting,
      onExited: handleExited,
    }),
    [
      show,
      timeout,
      classNames,
      handleEnter,
      handleEntering,
      handleEntered,
      handleExit,
      handleExiting,
      handleExited,
    ],
  );

  // 如果有切换模式，使用 SwitchTransition
  if (mode) {
    return (
      <SwitchTransition mode={mode}>
        <CSSTransition
          {...cssTransitionProps}
          key={React.Children.only(children).key || show.toString()}
        >
          {children}
        </CSSTransition>
      </SwitchTransition>
    );
  }

  // 否则直接使用 CSSTransition
  return <CSSTransition {...cssTransitionProps}>{children}</CSSTransition>;
};

export default EddieTransition;
