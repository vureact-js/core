import {
  Children,
  HTMLAttributes,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { TransitionGroup as ReactTransitionGroup } from 'react-transition-group';
import { CommonTransitionProps, useTransitionConfig } from '../hooks/useTransitionConfig';
import BaseTransition, { BaseTransitionProps, TransitionState } from './BaseTransition';

export interface TransitionGroupProps extends Omit<CommonTransitionProps, 'mode'> {
  /**
   * 如果未定义，不会生成额外容器。
   */
  tag?: string;
  /**
   * 用于自定义过渡期间被应用的 CSS class。
   * 仅用于重排位移动画，不影响 enter/leave 过渡类名。
   */
  moveClass?: string;
  /**
   * 用于为DOM容器添加HTML属性
   */
  htmlProps?: HTMLAttributes<HTMLElement>;
}

/**
 * React adapter for Vue's built-in component `<transition-group>`.
 * @see https://runtime.vureact.top/guide/components/transition-group.html
 */
export const TransitionGroup = memo((props: PropsWithChildren<TransitionGroupProps>) => {
  const { children, htmlProps, tag = null, ...transitionProps } = props;

  const transitionConfig = useTransitionConfig(transitionProps);

  const containerRef = useRef<HTMLDivElement>(null);

  // 存储位置，避免状态更新导致的不同步
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());

  // 跟踪初始渲染，以正确填充 positionsRef
  const isInitialRenderRef = useRef(true);

  // 用于跟踪当前正在执行 enter/leave 动画的节点
  const busyNodesRef = useRef(new Set<string>());
  const warnedMissingKeysRef = useRef(new Set<number>());

  const playWait = useRef(50);

  const moveClass = useMemo(() => transitionProps.moveClass || '', [transitionProps.moveClass]);

  const handleStateChange = useCallback((key: string, state: TransitionState) => {
    const busyNodes = busyNodesRef.current;
    if (state === 'entering') {
      busyNodes.add(key);
    } else if (state === 'leaving') {
      busyNodes.add(key);
      // 节点开始离开：立即移除其记录的位置，避免被 leave CSS 污染
      positionsRef.current.delete(key);
    } else {
      // idle
      busyNodes.delete(key);
      // 节点现在 "空闲" (idle)，立即捕获它的 "干净" 位置。
      const container = containerRef.current?.firstElementChild;
      if (container) {
        const node = container.querySelector(`[data-original-key="${key}"]`) as HTMLElement;
        if (node) {
          positionsRef.current.set(key, node.getBoundingClientRect());
        }
      }
    }
  }, []);

  const renderChildren = useMemo(() => {
    return Children.map(children, (child, index) => {
      const rawKey = (child as ReactElement)?.key;
      const key = rawKey?.toString() ?? `tg-${index}`;

      if (rawKey == null && !warnedMissingKeysRef.current.has(index)) {
        warnedMissingKeysRef.current.add(index);
        // eslint-disable-next-line no-console
        console.warn(
          '[TransitionGroup] Child element is missing a stable key; move transitions may be unstable.',
        );
      }

      return (
        <BaseTransition
          key={key}
          {...(transitionConfig as BaseTransitionProps)}
          __USE_THE_CONFIGURED_PROPS
          onStateChange={handleStateChange}
        >
          {child}
        </BaseTransition>
      );
    });
  }, [children, handleStateChange, transitionConfig]);

  const transitionGroupProps = useMemo(
    () => ({
      component: tag as 'div',
      appear: transitionConfig.appear,
      enter: transitionConfig.enter,
      exit: transitionConfig.exit,
      ...htmlProps,
    }),
    [htmlProps, tag, transitionConfig.appear, transitionConfig.enter, transitionConfig.exit],
  );

  useLayoutEffect(() => {
    // 必须有 moveClass 才使用 FLIP
    if (!moveClass || !Children.count(children)) {
      return;
    }

    const cleanUpTimeouts: (() => void)[] = [];

    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const oldPositions = positionsRef.current;
      const newPositions = new Map<string, DOMRect>();

      const childNodes = Array.from(containerRef.current.firstElementChild?.children || []);

      // 获取当前有效的 children keys
      const currentChildrenKeys = new Set(
        Children.map(children, (child) => (child as ReactElement)?.key?.toString()),
      );

      // 1. 记录所有节点的新位置（包括离开节点），确保其他节点能正确计算 delta
      childNodes.forEach((node) => {
        const el = node as HTMLElement;
        const key = el.dataset.originalKey;
        if (key && currentChildrenKeys.has(key)) {
          newPositions.set(key, el.getBoundingClientRect());
        }
      });

      // 2. 执行 FLIP 动画 (对所有需要移动的节点，但跳过离开节点)
      childNodes.forEach((node) => {
        const el = node as HTMLElement;
        const key = el.dataset.originalKey;

        if (!key) return;
        if (busyNodesRef.current.has(key)) return;
        if (isInitialRenderRef.current) return;

        const newRect = newPositions.get(key);
        const oldRect = oldPositions.get(key);

        // 仅对已存在的节点（非新进入）执行 FLIP
        if (oldRect && newRect) {
          const deltaX = oldRect.left - newRect.left;
          const deltaY = oldRect.top - newRect.top;

          // 阈值检查，防止插入/删除时的抖动
          const MOVEMENT_THRESHOLD = 1;
          if (Math.abs(deltaX) < MOVEMENT_THRESHOLD && Math.abs(deltaY) < MOVEMENT_THRESHOLD) {
            return;
          }

          // I (Invert)
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          el.style.transition = 'none';

          // P (Play) - 在下一帧应用
          // 延迟 "Play" 阶段，让 Enter/Leave 动画先启动。
          const playTimeout = setTimeout(() => {
            el.classList.add(moveClass);
            el.style.transform = '';
            el.style.transition = '';

            const onTransitionEnd = () => {
              el.classList.remove(moveClass);
              el.removeEventListener('transitionend', onTransitionEnd);
            };
            el.addEventListener('transitionend', onTransitionEnd);
          }, playWait.current);

          cleanUpTimeouts.push(() => clearTimeout(playTimeout));
        }
      });

      // 3. 更新 Ref
      positionsRef.current = newPositions;
      isInitialRenderRef.current = false;
    });

    return () => {
      cancelAnimationFrame(rafId);
      cleanUpTimeouts.forEach((fn) => fn());
    };
  }, [children, moveClass]);

  return (
    <div ref={containerRef} style={{ display: 'contents' }} data-transition-group-host>
      <ReactTransitionGroup {...transitionGroupProps}>{renderChildren}</ReactTransitionGroup>
    </div>
  );
});
