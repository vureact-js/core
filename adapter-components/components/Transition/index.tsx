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
  css?: boolean;
  appear?: boolean;
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
  onAppear?: (el: HTMLElement, done: () => void) => void;
  onAfterAppear?: (el: HTMLElement) => void;
}

export default memo(EddieTransition);

function EddieTransition(props: PropsWithChildren<EddieTransitionProps>) {
  const {
    mode,
    name = 'ed',
    children,
    show = false,
    css = true,
    appear = false,
    duration = 490, // 必须比设置的 css 过渡持续时间快 10ms，否则有概率会出现过渡效果结束后出现闪烁
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
    onAppear,
    onAfterAppear,
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
    if (css !== undefined && css === false) {
      return;
    }

    let baseClassNames;

    if (
      enterFromClass ||
      enterActiveClass ||
      enterToClass ||
      leaveFromClass ||
      leaveActiveClass ||
      leaveToClass
    ) {
      baseClassNames = {
        enter: enterFromClass || `${name}-enter-from`,
        enterActive: enterActiveClass || `${name}-enter-active`,
        enterDone: enterToClass || `${name}-enter-to`,
        exit: leaveFromClass || `${name}-leave-from`,
        exitActive: leaveActiveClass || `${name}-leave-active`,
        exitDone: leaveToClass || `${name}-leave-to`,
      };
    } else {
      const presetName = transitionNames[name] ?? name;
      baseClassNames = {
        enter: `${presetName}-enter ${presetName}-enter-from`,
        enterActive: `${presetName}-enter-active`,
        enterDone: `${presetName}-enter-to`,
        exit: `${presetName}-exit ${presetName}-leave-from`,
        exitActive: `${presetName}-exit-active ${presetName}-leave-active`,
        exitDone: `${presetName}-exit-to ${presetName}-leave-to`,
      };
    }

    // 只有当 appear 为 true 时才添加 appear 类名映射
    if (appear) {
      return {
        ...baseClassNames,
        appear: baseClassNames.enter, // 复用 enter 类名
        appearActive: baseClassNames.enterActive, // 复用 enterActive 类名
        appearDone: baseClassNames.enterDone, // 复用 enterDone 类名
      };
    }

    return baseClassNames;
  }, [
    css,
    enterFromClass,
    enterActiveClass,
    enterToClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
    name,
    appear,
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

      if (!appear) {
        onBeforeEnter?.(node);
      }
    },
    [appear, onBeforeEnter],
  );

  const handleEntering = useCallback(
    (node: HTMLElement) => {
      if (transitionStateRef.current === 'entering') {
        if (appear) {
          onAppear?.(node, () => {});
        } else {
          onEnter?.(node, () => {});
        }
      }
    },
    [appear, onAppear, onEnter],
  );

  const handleEntered = useCallback(
    (node: HTMLElement) => {
      if (transitionStateRef.current === 'entering') {
        transitionStateRef.current = 'idle';
        if (appear) {
          onAfterAppear?.(node);
        } else {
          onAfterEnter?.(node);
        }
      }
    },
    [appear, onAfterAppear, onAfterEnter],
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
      appear,
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
      appear,
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
