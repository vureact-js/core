import { useCallback, useMemo } from 'react';
import { CSSTransitionClassNames } from 'react-transition-group/CSSTransition';
import { TransitionActions } from 'react-transition-group/Transition';

export interface CommonTransitionProps {
  /**
   * 控制离开/进入过渡的时序。
   * 默认情况下是同时的。
   */
  mode?: 'in-out' | 'out-in';
  /**
   * 用于自动生成过渡 CSS class 名。
   * 例如 `name: 'fade'` 将自动扩展为 `.fade-enter`、
   * `.fade-enter-active` 等。
   */
  name?: string;
  /**
   * 是否应用 CSS 过渡 class。
   * 默认：true
   */
  css?: boolean;
  /**
   * 是否对初始渲染使用过渡。
   * 默认：false
   */
  appear?: boolean;
  /**
   * 显式指定过渡的持续时间。
   */
  duration?: number | { enter: number; leave: number };

  /**
   * 用于自定义过渡 class 的 prop。
   */
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  appearFromClass?: string;
  appearActiveClass?: string;
  appearToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;

  /**
   * 事件钩子
   */
  onBeforeEnter?: (el: HTMLElement) => void;
  onEnter?: (el: HTMLElement, done: () => void) => void;
  onAfterEnter?: (el: HTMLElement) => void;
  onBeforeAppear?: (el: HTMLElement) => void;
  onAppear?: (el: HTMLElement, done: () => void) => void;
  onAfterAppear?: (el: HTMLElement) => void;
  onBeforeLeave?: (el: HTMLElement) => void;
  onLeave?: (el: HTMLElement, done: () => void) => void;
  onAfterLeave?: (el: HTMLElement) => void;
  onEnterCancelled?: (el: HTMLElement) => void;
  onLeaveCancelled?: (el: HTMLElement) => void;
}

export interface TransitionConfig extends TransitionActions {
  classNames?: string | CSSTransitionClassNames;
  timeout: number | { enter: number; exit: number; appear?: number };
  appear: boolean;
  onEnter?: (node: HTMLElement, isAppearing: boolean) => void;
  onEntering?: (node: HTMLElement, isAppearing: boolean) => void;
  onEntered?: (node: HTMLElement, isAppearing: boolean) => void;
  onExit?: (node: HTMLElement) => void;
  onExiting?: (node: HTMLElement) => void;
  onExited?: (node: HTMLElement) => void;
}

const defaultDuration = 500;
const diff = 10;

export const getActualDuration = (
  duration: CommonTransitionProps['duration'],
  type: 'enter' | 'leave',
) => {
  if (typeof duration === 'number') {
    return Math.max(0, duration - diff);
  }

  const value =
    type === 'enter' ? (duration?.enter ?? defaultDuration) : (duration?.leave ?? defaultDuration);
  return Math.max(0, value - diff);
};

export function useTransitionConfig(props: CommonTransitionProps): TransitionConfig {
  const {
    name = '',
    css = true,
    appear = false,
    duration = defaultDuration,
    enterFromClass,
    enterActiveClass,
    enterToClass,
    appearFromClass,
    appearActiveClass,
    appearToClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
    onBeforeEnter,
    onEnter,
    onAfterEnter,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
    onBeforeAppear,
    onAppear,
    onAfterAppear,
  } = props;

  const classNames = useMemo<TransitionConfig['classNames']>(() => {
    if (!css) {
      return undefined;
    }

    const enter = enterFromClass || (name ? `${name}-enter-from` : undefined);
    const enterActive = enterActiveClass || (name ? `${name}-enter-active` : undefined);
    const enterDone = enterToClass || (name ? `${name}-enter-to` : undefined);

    const exit = leaveFromClass || (name ? `${name}-leave-from` : undefined);
    const exitActive = leaveActiveClass || (name ? `${name}-leave-active` : undefined);
    const exitDone = leaveToClass || (name ? `${name}-leave-to` : undefined);

    const appearCls = appearFromClass || enter;
    const appearActive = appearActiveClass || enterActive;
    const appearDone = appearToClass || enterDone;

    return {
      enter,
      enterActive,
      enterDone,
      exit,
      exitActive,
      exitDone,
      appear: appear ? appearCls : undefined,
      appearActive: appear ? appearActive : undefined,
      appearDone: appear ? appearDone : undefined,
    };
  }, [
    appear,
    appearActiveClass,
    appearFromClass,
    appearToClass,
    css,
    enterActiveClass,
    enterFromClass,
    enterToClass,
    leaveActiveClass,
    leaveFromClass,
    leaveToClass,
    name,
  ]);

  const timeout = useMemo<TransitionConfig['timeout']>(() => {
    if (typeof duration === 'number') {
      return Math.max(0, duration - diff);
    }

    return {
      enter: getActualDuration(duration, 'enter'),
      appear: getActualDuration(duration, 'enter'),
      exit: getActualDuration(duration, 'leave'),
    };
  }, [duration]);

  const handleEnter = useCallback(
    (node: HTMLElement, isAppearing: boolean) => {
      if (isAppearing) {
        onBeforeAppear?.(node);
      } else {
        onBeforeEnter?.(node);
      }
    },
    [onBeforeAppear, onBeforeEnter],
  );

  const handleEntering = useCallback(
    (node: HTMLElement, isAppearing: boolean) => {
      if (isAppearing) {
        onAppear?.(node, () => {});
      } else {
        onEnter?.(node, () => {});
      }
    },
    [onAppear, onEnter],
  );

  const handleEntered = useCallback(
    (node: HTMLElement, isAppearing: boolean) => {
      if (isAppearing) {
        onAfterAppear?.(node);
      } else {
        onAfterEnter?.(node);
      }
    },
    [onAfterAppear, onAfterEnter],
  );

  const handleExit = useCallback(
    (node: HTMLElement) => {
      onBeforeLeave?.(node);
    },
    [onBeforeLeave],
  );

  const handleExiting = useCallback(
    (node: HTMLElement) => {
      onLeave?.(node, () => {});
    },
    [onLeave],
  );

  const handleExited = useCallback(
    (node: HTMLElement) => {
      onAfterLeave?.(node);
    },
    [onAfterLeave],
  );

  return useMemo<TransitionConfig>(
    () => ({
      classNames,
      timeout,
      appear,
      onEnter: handleEnter,
      onEntering: handleEntering,
      onEntered: handleEntered,
      onExit: handleExit,
      onExiting: handleExiting,
      onExited: handleExited,
    }),
    [
      appear,
      classNames,
      handleEnter,
      handleEntered,
      handleEntering,
      handleExit,
      handleExited,
      handleExiting,
      timeout,
    ],
  );
}
