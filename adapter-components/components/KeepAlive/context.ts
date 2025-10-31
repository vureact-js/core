import { createContext, startTransition, useContext } from 'react';

// 生命周期 Context 与注册机制

type ListenerItem = {
  id: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  hasTriggeredActivate?: boolean;
};

type ListenerMap = Map<string, Map<number, ListenerItem>>;

interface KeepAliveLifeContextValue {
  registerListener: (
    key: string,
    handlers: { onActivate?: () => void; onDeactivate?: () => void },
    allowRetroactive?: boolean,
  ) => number;
  unregisterListener: (key: string, id: number) => void;
  notifyActivate: (key: string) => void;
  notifyDeactivate: (key: string) => void;
}

export const KeepAliveLifeContext = createContext<KeepAliveLifeContextValue | null>(null);
export const InnerKeyContext = createContext<string | null>(null);

export function createKeepAliveLifeContextValue(): KeepAliveLifeContextValue {
  const listenersRef = { current: new Map() as ListenerMap };
  const activatedKeysRef = { current: new Set<string>() }; // 记录当前处于激活状态的 key 集合
  let idCounter = 0;

  // 注册监听器
  const registerListener: KeepAliveLifeContextValue['registerListener'] = (
    key,
    handlers,
    allowRetroactive = true, // 是否允许补触发
  ) => {
    idCounter++;
    let sub = listenersRef.current.get(key);
    if (!sub) {
      sub = new Map();
      listenersRef.current.set(key, sub);
    }

    const listenerItem: ListenerItem = {
      id: idCounter,
      ...handlers,
      hasTriggeredActivate: false,
    };

    sub.set(idCounter, listenerItem);

    // 如果该 key 当前已处于激活状态且未触发过，则立即补触发一次 onActivate。
    if (allowRetroactive && activatedKeysRef.current.has(key) && handlers.onActivate) {
      // 用微任务触发，确保 React commit 后执行，不阻塞注册
      startTransition(() => {
        handlers.onActivate?.();
        listenerItem.hasTriggeredActivate = true;
      });
    }

    return idCounter;
  };

  // 取消监听器
  const unregisterListener = (key: string, id: number) => {
    const sub = listenersRef.current.get(key);
    if (!sub) return;
    sub.delete(id);
    if (!sub.size) listenersRef.current.delete(key);
  };

  // 触发激活事件
  const notifyActivate = (key: string) => {
    activatedKeysRef.current.add(key); // 标记当前 key 为激活状态
    const sub = listenersRef.current.get(key);
    if (!sub) return;
    for (const item of sub.values()) {
      item.onActivate?.();
      item.hasTriggeredActivate = true;
    }
  };

  // 触发停用事件
  const notifyDeactivate = (key: string) => {
    activatedKeysRef.current.delete(key); // 从激活集合中移除
    const sub = listenersRef.current.get(key);
    if (!sub) return;
    for (const item of sub.values()) {
      item.onDeactivate?.();
    }
  };

  return { registerListener, unregisterListener, notifyActivate, notifyDeactivate };
}

export function useKeepAliveLifeContext() {
  const ctx = useContext(KeepAliveLifeContext);
  if (!ctx) return;
  return ctx;
}

export function useInnerKeepAliveKey() {
  return useContext(InnerKeyContext);
}
