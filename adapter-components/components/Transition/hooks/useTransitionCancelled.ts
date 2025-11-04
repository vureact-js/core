import { RefObject, useEffect } from 'react';
import { BaseTransitionProps, getActualDuration } from './useTransitionConfig';

type UseTransitionCancelled = {
  show?: boolean;
  duration?: BaseTransitionProps['duration'];
  prevTime: RefObject<number>;
  prevShowRef: RefObject<boolean | undefined>;
  currentNodeRef: RefObject<HTMLElement | null>;
  transitionStateRef: RefObject<'idle' | 'entering' | 'leaving'>;
  onEnterCancelled: BaseTransitionProps['onEnterCancelled'];
  onLeaveCancelled: BaseTransitionProps['onLeaveCancelled'];
};

/**
 * 处理 Transition 组件取消事件
 */
export const useTransitionCancelled = (params: UseTransitionCancelled) => {
  const {
    show,
    duration,
    prevTime,
    prevShowRef,
    currentNodeRef,
    transitionStateRef,
    onEnterCancelled,
    onLeaveCancelled,
  } = params;

  useEffect(() => {
    // 计算两次事件触发的时间差间隔
    const timeSinceLastTransition = Date.now() - prevTime.current;

    // 根据过渡方向获取对应的 duration
    const relevantDuration =
      !show && prevShowRef.current
        ? getActualDuration(duration, 'leave') // 正在离开
        : show && !prevShowRef.current
          ? getActualDuration(duration, 'enter') // 正在进入
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
      // eslint-disable-next-line react-hooks/immutability
      prevTime.current = Date.now();
    }
  }, [
    currentNodeRef,
    duration,
    onEnterCancelled,
    onLeaveCancelled,
    prevShowRef,
    prevTime,
    show,
    transitionStateRef,
  ]);
};
