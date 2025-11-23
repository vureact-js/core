import {
  Children,
  HTMLAttributes,
  HTMLElementType,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { TransitionGroup as ReactTransitionGroup } from 'react-transition-group';
import { BaseTransitionProps, useTransitionConfig } from '../hooks/useTransitionConfig';
import Transition from './Transition';

export interface TransitionGroupProps extends Omit<BaseTransitionProps, 'mode'> {
  /**
   * By default, it will render a div as the container,
   * which can be customized using this prop.
   */
  tag?: HTMLElementType | null;
  /**
   * Used to add HTML attributes to the DOM container
   */
  htmlProps?: HTMLAttributes<HTMLElement>;
  /**
   * Used to customize the CSS class names applied during the transition.
   * For example: `moveClassName="xxx"`
   */
  moveClassName?: string;
}

export default memo(TransitionGroup);

function TransitionGroup(props: PropsWithChildren<TransitionGroupProps>) {
  const { children, htmlProps, tag = null, ...transitionProps } = props;

  const transitionConfig = useTransitionConfig(transitionProps);

  const containerRef = useRef<HTMLDivElement>(null);

  // 存储位置，避免状态更新导致的不同步
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());

  // 跟踪初始渲染，以正确填充 positionsRef
  const isInitialRenderRef = useRef(true);

  // 用于跟踪当前正在执行 enter/leave 动画的节点
  const busyNodesRef = useRef(new Set<string>());

  const moveClassName = useMemo(
    () => transitionProps.moveClassName || `${transitionProps.name}-move`,
    [transitionProps.moveClassName, transitionProps.name],
  );

  const handleStateChange = useCallback((key: string, state: 'idle' | 'busy') => {
    const busyNodes = busyNodesRef.current;
    if (state === 'busy') {
      busyNodes.add(key);
    } else {
      busyNodes.delete(key);

      // 节点现在 "空闲" (idle)，立即捕获它的 "干净" 位置。
      // 这是下次 FLIP 动画的 "F" (First) 阶段所要用的。
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
      const key = (child as ReactElement)?.key?.toString() ?? `tg-${index}`;

      return (
        <Transition
          show
          key={key}
          {...transitionConfig}
          __USE_THE_CONFIGURED_PROPS
          onStateChange={handleStateChange}
        >
          {child}
        </Transition>
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
    const cleanUpTimeouts: (() => void)[] = [];

    requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const newPositions = new Map<string, DOMRect>();
      const oldPositions = positionsRef.current;

      const childNodes = Array.from(containerRef.current.firstElementChild?.children || []);

      const updatePositions = () => {
        // 合并新的 "干净" 位置和旧的位置，"忙碌" 节点的旧位置信息不会丢失
        // 用新的 "空闲" 位置更新 ref
        const finalPositions = new Map(oldPositions);
        newPositions.forEach((rect, key) => {
          finalPositions.set(key, rect);
        });

        // 清理掉已离开 (unmounted) 节点的旧位置
        const newKeySet = new Set(childNodes.map((n) => (n as HTMLElement).dataset.originalKey));
        oldPositions.forEach((rect, key) => {
          if (!newKeySet.has(key) && !busyNodesRef.current.has(key)) {
            // 这个 key 不在新的 DOM 中，也不在 busy 列表里 (即 leave 动画已完成)
            finalPositions.delete(key);
          }
        });

        positionsRef.current = finalPositions;
        isInitialRenderRef.current = false;
      };

      // 1. 记录所有节点的新位置（包括离开节点），确保其他节点能正确计算 delta
      childNodes.forEach((node) => {
        const el = node as HTMLElement;
        const key = el.dataset.originalKey;
        if (key) {
          newPositions.set(key, el.getBoundingClientRect());
        }
      });

      // 如果没有 moveClassName 或者节点不是绝对定位，禁用 FLIP
      const shouldAnimate = moveClassName && childNodes.length > 0;
      if (!shouldAnimate) {
        // 只更新位置，不执行 FLIP 动画
        updatePositions();
        return;
      }

      // 2. 执行 L-I-P (对所有需要移动的节点，但跳过离开节点)
      childNodes.forEach((node) => {
        const el = node as HTMLElement;
        const key = el.dataset.originalKey;

        if (!key) return;

        // 如果节点正在进入 (entering)，跳过 FLIP
        if (busyNodesRef.current.has(key)) return;

        // 如果是初始渲染，跳过 FLIP
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
            el.classList.add(moveClassName);
            el.style.transform = '';
            el.style.transition = '';

            const onTransitionEnd = () => {
              el.classList.remove(moveClassName);
              el.removeEventListener('transitionend', onTransitionEnd);
            };
            el.addEventListener('transitionend', onTransitionEnd);
          }, 20);

          cleanUpTimeouts.push(() => clearTimeout(playTimeout));
        }
      });

      // 4. 更新 Ref
      updatePositions();
    });

    return () => {
      cleanUpTimeouts.forEach((fn) => fn());
    };
  }, [children, moveClassName]);

  return (
    <div ref={containerRef} style={{ display: 'contents' }} data-transition-group-host>
      <ReactTransitionGroup {...transitionGroupProps}>{renderChildren}</ReactTransitionGroup>
    </div>
  );
}
