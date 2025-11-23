// hooks/useTransitionConfig.ts
import { useCallback, useMemo } from 'react';
import { TransitionActions } from 'react-transition-group/Transition';
import { transitionNames } from '../styles';

export interface BaseTransitionProps {
  /**
   * Show the component; triggers the enter or exit states
   */
  show?: boolean;
  /**
   * Used to automatically generate transition CSS class names.
   * e.g. `name: 'fade'` will auto expand to `.fade-enter`,
   * `.fade-enter-active`, etc.
   */
  name?: string;
  /**
   * Whether to apply CSS transition classes.
   * Default: true
   */
  css?: boolean;
  /**
   * Whether to apply transition on initial render.
   * Default: false
   */
  appear?: boolean;
  /**
   * Specifies explicit durations of the transition.
   * Default behavior is wait for the first `transitionend`
   * or `animationend` event on the root transition element.
   */
  duration?: number | { enter: number; leave: number };
  /**
   * Props for customizing transition classes.
   */
  enterFrom?: string;
  enterActive?: string;
  enterTo?: string;
  appearFrom?: string;
  appearActive?: string;
  appearTo?: string;
  leaveFrom?: string;
  leaveActive?: string;
  leaveTo?: string;
  /**
   * Callback fired before the "entering" status is applied.
   */
  onBeforeEnter?: (el: HTMLElement) => void;
  /**
   * Callback fired after the "entering" status is applied.
   */
  onEnter?: (el: HTMLElement, done: () => void) => void;
  /**
   * Callback fired after the "entered" status is applied.
   */
  onAfterEnter?: (el: HTMLElement) => void;
  /**
   * Callback fired after the "appearing" status is applied.
   */
  onAppear?: (el: HTMLElement, done: () => void) => void;
  /**
   * Callback fired after the "appeared" status is applied.
   */
  onAfterAppear?: (el: HTMLElement) => void;
  /**
   * Callback fired before the "exiting" status is applied.
   */
  onBeforeLeave?: (el: HTMLElement) => void;
  /**
   * Callback fired after the "exiting" status is applied.
   */
  onLeave?: (el: HTMLElement, done: () => void) => void;
  /**
   * Callback fired after the "exited" status is applied.
   */
  onAfterLeave?: (el: HTMLElement) => void;
  /**
   * Callback fired when the "entering" state is canceled.
   */
  onEnterCancelled?: (el: HTMLElement) => void;
  /**
   * Callback fired when the "leaving" state is canceled.
   */
  onLeaveCancelled?: (el: HTMLElement) => void;
}

export interface TransitionConfig extends TransitionActions {
  classNames?: {
    enter?: string;
    enterActive?: string;
    enterDone?: string;
    exit?: string;
    exitActive?: string;
    exitDone?: string;
    appear?: string;
    appearActive?: string;
    appearDone?: string;
  };
  timeout: number | { enter: number; exit: number; appear?: number };
  appear: boolean;
  // 事件处理函数
  onEnter?: (node: HTMLElement) => void;
  onEntering?: (node: HTMLElement) => void;
  onEntered?: (node: HTMLElement) => void;
  onExit?: (node: HTMLElement) => void;
  onExiting?: (node: HTMLElement) => void;
  onExited?: (node: HTMLElement) => void;
}

const defaultDuration = 500;
const diff = 10;

// 处理 duration 为对象类型的计算
export const getActualDuration = (
  duration: BaseTransitionProps['duration'],
  type: 'enter' | 'leave',
) => {
  // 必须比设置的 css 过渡持续时间快 10ms，否则有概率会出现过渡效果结束后出现闪烁
  if (typeof duration === 'number') {
    return duration - diff;
  }
  return type === 'enter'
    ? (duration?.enter ?? defaultDuration) - diff
    : (duration?.leave ?? defaultDuration) - diff;
};

export function useTransitionConfig(props: BaseTransitionProps): TransitionConfig {
  const {
    name = 'rv',
    css = true,
    appear = false,
    duration = defaultDuration,
    enterFrom,
    enterActive,
    enterTo,
    appearFrom,
    appearActive,
    appearTo,
    leaveFrom,
    leaveActive,
    leaveTo,
    onBeforeEnter,
    onEnter,
    onAfterEnter,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
    onAppear,
    onAfterAppear,
  } = props;

  // 计算类名配置
  const classNames = useMemo(() => {
    let baseClassNames;

    if (
      enterFrom ||
      enterActive ||
      enterTo ||
      appearFrom ||
      appearActive ||
      appearTo ||
      leaveFrom ||
      leaveActive ||
      leaveTo
    ) {
      baseClassNames = {
        enter: (!appear ? enterFrom : appearFrom) || `${name}-enter-from`,
        enterActive: (!appear ? enterActive : appearActive) || `${name}-enter-active`,
        enterDone: (!appear ? enterTo : appearTo) || `${name}-enter-to`,
        exit: leaveFrom || `${name}-leave-from`,
        exitActive: leaveActive || `${name}-leave-active`,
        exitDone: leaveTo || `${name}-leave-to`,
      };
    } else {
      const presetName = transitionNames[name] ?? name;
      baseClassNames = {
        enter: `${presetName}-enter-from`,
        enterActive: `${presetName}-enter-active`,
        enterDone: `${presetName}-enter-to`,
        exit: `${presetName}-leave-from`,
        exitActive: `${presetName}-leave-active`,
        exitDone: `${presetName}-leave-to`,
      };
    }

    // 只有当 appear 为 true 时才添加 appear 类名映射
    if (appear) {
      return {
        ...baseClassNames,
        appear: baseClassNames.enter,
        appearActive: baseClassNames.enterActive,
        appearDone: baseClassNames.enterDone,
      };
    }

    return baseClassNames;
  }, [
    enterFrom,
    enterActive,
    enterTo,
    appearFrom,
    appearActive,
    appearTo,
    leaveFrom,
    leaveActive,
    leaveTo,
    appear,
    name,
  ]);

  // 计算超时时间
  const timeout = useMemo(() => {
    if (typeof duration === 'number') {
      return duration - diff;
    }
    return {
      enter: getActualDuration(duration, 'enter'),
      appear: getActualDuration(duration, 'enter'),
      exit: getActualDuration(duration, 'leave'),
    };
  }, [duration]);

  // 事件处理函数
  const handleEnter = useCallback(
    (node: HTMLElement) => {
      if (!appear) {
        onBeforeEnter?.(node);
      }
    },
    [appear, onBeforeEnter],
  );

  const handleEntering = useCallback(
    (node: HTMLElement) => {
      if (appear) {
        onAppear?.(node, () => {});
      } else {
        onEnter?.(node, () => {});
      }
    },
    [appear, onAppear, onEnter],
  );

  const handleEntered = useCallback(
    (node: HTMLElement) => {
      if (appear) {
        onAfterAppear?.(node);
      } else {
        onAfterEnter?.(node);
      }
    },
    [appear, onAfterAppear, onAfterEnter],
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

  const config = useMemo<TransitionConfig>(
    () => ({
      enter: css,
      exit: css,
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
      css,
      handleEnter,
      handleEntered,
      handleEntering,
      handleExit,
      handleExited,
      handleExiting,
      timeout,
    ],
  );

  return config;
}
