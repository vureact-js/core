import {
  Children,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { getComponentName } from 'utils';
import './css/eddie-transition.css';
import { transitionNames } from './styles';

export interface EddieTransitionProps {
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

export default memo(EddieTransition);

function EddieTransition(props: PropsWithChildren<EddieTransitionProps>) {
  const {
    children,
    show = false,
    name = 'ed',
    mode,
    duration = 290,
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

  const child = Children.only(children as ReactElement);
  // 使用 key/组件名/标签名
  const key = child?.key || getComponentName(child) || child.type.toString();

  const prevTime = useRef(0);
  const prevShowRef = useRef(show);
  const currentNodeRef = useRef<HTMLElement>(null);
  const transitionStateRef = useRef<'idle' | 'entering' | 'leaving'>('idle');

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

    const presetName = transitionNames[name] ?? name;
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

  // 处理 duration 为对象类型的计算
  const getActualDuration = useCallback(
    (type: 'enter' | 'leave') => {
      if (typeof duration === 'number') {
        return duration;
      }
      return type === 'enter' ? duration.enter : duration.leave;
    },
    [duration],
  );

  // 使用 useMemo 优化超时时间计算
  const timeout = useMemo(() => {
    if (typeof duration === 'number') {
      return duration;
    }
    return {
      enter: getActualDuration('enter'),
      exit: getActualDuration('leave'),
    };
  }, [duration, getActualDuration]);

  const handleEnter = useCallback(
    (node: HTMLElement) => {
      transitionStateRef.current = 'entering';
      currentNodeRef.current = node;
      onBeforeEnter?.(node);
    },
    [onBeforeEnter],
  );

  const handleEntering = useCallback(
    (node: HTMLElement) => {
      if (transitionStateRef.current === 'entering') {
        onEnter?.(node, () => {});
      }
    },
    [onEnter],
  );

  const handleEntered = useCallback(
    (node: HTMLElement) => {
      if (transitionStateRef.current === 'entering') {
        transitionStateRef.current = 'idle';
        onAfterEnter?.(node);
      }
    },
    [onAfterEnter],
  );

  const handleExit = useCallback(
    (node: HTMLElement) => {
      transitionStateRef.current = 'leaving';
      currentNodeRef.current = node;
      onBeforeLeave?.(node);
    },
    [onBeforeLeave],
  );

  const handleExiting = useCallback(
    (node: HTMLElement) => {
      if (transitionStateRef.current === 'leaving') {
        onLeave?.(node, () => {});
      }
    },
    [onLeave],
  );

  const handleExited = useCallback(
    (node: HTMLElement) => {
      if (transitionStateRef.current === 'leaving') {
        transitionStateRef.current = 'idle';
        onAfterLeave?.(node);
      }
    },
    [onAfterLeave],
  );

  const handleCancelled = useCallback(() => {
    const timeSinceLastTransition = Date.now() - prevTime.current;

    // 根据过渡方向获取对应的 duration
    const relevantDuration =
      !show && prevShowRef.current
        ? getActualDuration('leave') // 正在离开
        : show && !prevShowRef.current
          ? getActualDuration('enter') // 正在进入
          : 0;

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
  }, [getActualDuration, onEnterCancelled, onLeaveCancelled, show]);

  useEffect(handleCancelled, [handleCancelled]);

  // 基础 CSSTransition 配置
  const cssTransitionProps = useMemo(
    () => ({
      key,
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
      key,
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

  const transitionElement = useMemo(() => {
    return <CSSTransition {...cssTransitionProps}>{child}</CSSTransition>;
  }, [cssTransitionProps, child]);

  if (mode) {
    return <SwitchTransition mode={mode}>{transitionElement}</SwitchTransition>;
  }

  return transitionElement;
}
