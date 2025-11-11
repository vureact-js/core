import {
  Children,
  HTMLAttributes,
  HTMLElementType,
  isValidElement,
  Key,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Flipped, Flipper } from 'react-flip-toolkit';
import { TransitionGroup as ReactTransitionGroup } from 'react-transition-group';
import {
  BaseTransitionProps,
  getActualDuration,
  useTransitionConfig,
} from '../hooks/useTransitionConfig';
import Transition from './Transition';

export interface TransitionGroupProps extends Omit<BaseTransitionProps, 'mode'> {
  /**
   * By default, it will render a div as the container,
   * which can be customized using this prop.
   */
  tag?: HTMLElementType;
  /**
   * Used to add HTML attributes to the DOM container
   */
  htmlProps?: HTMLAttributes<HTMLElement>;
  /**
   * Predefined Spring physics effects
   *
   * `quickStiff` Swift & Rigid,
   * `smoothSlow` Smooth & Slow,
   * `wobbleLight` Light Bounce,
   * `gentle` Gentle Preset,
   * `default` No Wobble Standard.
   */
  moveSpring?: 'quickStiff' | 'smoothSlow' | 'wobbleLight' | 'gentle' | 'default';
}

export default memo(TransitionGroup);

function TransitionGroup(props: PropsWithChildren<TransitionGroupProps>) {
  const {
    children,
    htmlProps,
    tag: element = 'div',
    moveSpring = 'default',
    ...transitionProps
  } = props;

  const transitionConfig = useTransitionConfig(transitionProps);

  const { duration } = transitionProps;
  const { classNames } = transitionConfig;

  const appearTimer = useRef<number | number>(null);
  const exitTimer = useRef<number | number>(null);

  const getKeys = useCallback(() => {
    return Children.toArray(children)
      .filter(isValidElement)
      .map((child) => child.key as Key);
  }, [children]);

  // 更新 flipKey 以触发 FLIP 动画
  const flipKey = useMemo(() => getKeys(), [getKeys]);

  const hasTransition = useMemo(() => transitionProps.css !== false, [transitionProps.css]);

  const enterDuration = useMemo(() => getActualDuration(duration, 'enter'), [duration]);

  const leaveDuration = useMemo(() => getActualDuration(duration, 'leave'), [duration]);

  const enterCls = useMemo(
    () => classNames?.enter || classNames?.appear || '',
    [classNames?.appear, classNames?.enter],
  );

  const enterActiveCls = useMemo(
    () => classNames?.enterActive || classNames?.appearActive || '',
    [classNames?.appearActive, classNames?.enterActive],
  );

  const enteredCls = useMemo(
    () => classNames?.enterDone || classNames?.appearDone || '',
    [classNames?.appearDone, classNames?.enterDone],
  );

  const leaveCls = useMemo(() => classNames?.exit || '', [classNames?.exit]);

  const leaveActiveCls = useMemo(() => classNames?.exitActive || '', [classNames?.exitActive]);

  const leaveToCls = useMemo(() => classNames?.exitDone || '', [classNames?.exitDone]);

  const moveSpringConfig = useMemo(() => {
    switch (moveSpring) {
      case 'quickStiff':
        // 超快速、无晃动的移动
        return { stiffness: 350, damping: 30 };

      case 'smoothSlow':
        // 缓慢、优雅的移动
        return { stiffness: 80, damping: 35 };

      case 'wobbleLight':
        // 快速，但有轻微的弹性回弹
        return { stiffness: 150, damping: 10 };

      case 'gentle':
        // 使用库内置的柔和预设
        return 'gentle';

      default:
        // 平稳且速度适中（约 0.4s-0.5s）
        return {
          stiffness: 150, // stiffness: 调整动画启动速度
          damping: 22, // damping: 调整动画停止后的晃动力度
        };
    }
  }, [moveSpring]);

  // 进场：在这里处理进场动画，确保元素带着动画出现
  const handleFlipAppear = useCallback(
    (node: HTMLElement) => {
      // 1. 设置 enter-from 类
      node.classList.add(enterCls);
      node.classList.add(enterActiveCls);

      // 2. 移除 enter-from 类，开始过渡到 enter-to 状态
      requestAnimationFrame(() => {
        node.classList.remove(enterCls);
        node.classList.add(enteredCls);
        node.style.opacity = '1';
      });

      // 3. 清理 enter-active 类
      appearTimer.current = setTimeout(() => {
        node.classList.remove(enterActiveCls);
      }, enterDuration);
    },
    [enterCls, enterActiveCls, enterDuration, enteredCls],
  );

  // 离场：FLIP 移动的关键接管点
  const handleFlipExit = useCallback(
    (node: HTMLElement, _: number, removeElement: () => void) => {
      // 1. Flipped 阻止了元素被立即移除 (FLIP 移动可以计算了)
      // 2. 手动应用离场过渡类 (leave-active, leave-to)
      node.classList.add(leaveCls);
      node.classList.add(leaveActiveCls);

      requestAnimationFrame(() => {
        node.classList.remove(leaveCls);
        node.classList.add(leaveToCls);
      });

      // 3. 在 CSS 动画结束后，执行 Flipped 的移除函数
      exitTimer.current = setTimeout(removeElement, leaveDuration);
    },
    [leaveActiveCls, leaveCls, leaveDuration, leaveToCls],
  );

  useEffect(
    () => () => {
      clearTimeout(appearTimer.current!);
      clearTimeout(exitTimer.current!);
    },
    [],
  );

  const renderChildren = useMemo(() => {
    return Children.map(children, (child, index) => {
      const key = (child as ReactElement)?.key ?? `tg-${index}`;
      return (
        <Transition show key={key} {...transitionConfig} __USE_THE_CONFIGURED_PROPS>
          {hasTransition ? (
            <Flipped flipId={key} onAppear={handleFlipAppear} onExit={handleFlipExit}>
              {child}
            </Flipped>
          ) : (
            child
          )}
        </Transition>
      );
    });
  }, [children, handleFlipAppear, handleFlipExit, hasTransition, transitionConfig]);

  const render = useMemo(
    () =>
      hasTransition ? (
        <ReactTransitionGroup component={null}>
          <Flipper
            {...htmlProps}
            {...{ flipKey, element }}
            spring={moveSpringConfig}
            staggerConfig={{
              default: {
                reverse: true,
                speed: 0.5,
              },
            }}
          >
            {renderChildren}
          </Flipper>
        </ReactTransitionGroup>
      ) : (
        <ReactTransitionGroup component={element as 'div'} {...htmlProps}>
          {renderChildren}
        </ReactTransitionGroup>
      ),
    [element, flipKey, htmlProps, moveSpringConfig, hasTransition, renderChildren],
  );

  return render;
}
