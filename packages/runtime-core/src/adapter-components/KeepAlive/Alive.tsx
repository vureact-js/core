import {
  Children,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { getComponentName, getReactType } from '../utils';
import { createKeepAliveLifeContextValue, InnerKeyContext, KeepAliveLifeContext } from './context';
import { useActived } from './hooks/useActived';
import { useDeactived } from './hooks/useDeactived';
import { matchPattern } from './utils';

interface KeepAliveProps {
  /**
   * If specified, only components that match the `include` key will be cached.
   *
   * It will match based on the component's key, using the component name by default.
   */
  include?: MatchPattern;
  /**
   * Any component whose key matches `exclude` will not be cached.
   *
   * It will match based on the component's key, using the component name by default.
   */
  exclude?: MatchPattern;
  /**
   * The maximum number of component instances that can be cached.
   */
  max?: number | string;
}

type MatchPattern = string | RegExp | (string | RegExp)[];

export { useActived, useDeactived, type KeepAliveProps, type MatchPattern };

// 全局离屏容器：所有 KeepAlive 共享同一个，用于挂载非激活组件
const globalOffscreenContainer: HTMLElement | null =
  typeof document !== 'undefined' ? (() => document.createElement('div'))() : null;

/**
 * Equivalent to Vue `<KeepAlive>` component, with the same props and usage.
 *
 * @see https://vureact-runtime.vercel.app/en/components/keep-alive
 */
export const KeepAlive = memo((props: PropsWithChildren<KeepAliveProps>) => {
  const { include, exclude, max = 10, children } = props;

  const lifeValueRef = useRef(createKeepAliveLifeContextValue());
  const cacheRef = useRef(new Map<string, ReactElement>()); // key -> element
  const cacheContainerRef = useRef(new Map<string, HTMLElement>()); // key -> wrapper DOM
  const prevActiveKeyRef = useRef<string | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null); // KeepAlive 在页面中的宿主节点

  const [, forceUpdate] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [_, setVisibleKeys] = useState<Set<string>>(new Set());

  if (Children.count(children) !== 1) {
    console.error('[KeepAlive] There must be only one direct child component.');
    return <>{children}</>;
  }

  const reactType = getReactType(children);

  if (reactType !== 'element' && reactType !== 'component') {
    console.error('[KeepAlive] The child element must be a component.');
    return <>{children}</>;
  }

  const compName = getComponentName(children as ReactElement);
  const reactKey = (children as ReactElement).key;

  // 若 compName 为空则不缓存
  const cacheKey = reactKey || compName || null;

  const shouldCache = useMemo(() => {
    if (!cacheKey) return false;

    // 1. 优先处理 include
    if (include) {
      const isIncluded =
        matchPattern(include, compName) || (cacheKey != null && matchPattern(include, cacheKey));

      if (!isIncluded) return false;

      // 如果 include 匹配，再检查 exclude
      if (exclude) {
        const isExcluded =
          matchPattern(exclude, compName) || (cacheKey != null && matchPattern(exclude, cacheKey));
        return !isExcluded;
      }

      return true;
    }

    // 2. 只有 exclude 的情况
    if (exclude) {
      const isExcluded =
        matchPattern(exclude, compName) || (cacheKey != null && matchPattern(exclude, cacheKey));
      return !isExcluded;
    }

    // 3. 默认情况：都缓存
    return true;
  }, [include, exclude, cacheKey, compName]);

  // 缓存管理（创建 wrapper DOM 并确保 portal 渲染到 wrapper）
  useEffect(() => {
    const cleanCache = (key: string) => {
      // 保证先触发停用回调
      lifeValueRef.current.notifyDeactivate(key);

      // 移除 wrapper DOM
      const wrapper = cacheContainerRef.current.get(key);
      if (wrapper) {
        // 如果 wrapper 仍在 host 或 offscreen，remove 掉
        wrapper.remove();
        cacheContainerRef.current.delete(key);
      }

      cacheRef.current.delete(key);
      setVisibleKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    // 清理不应该缓存的组件
    if (!shouldCache && cacheKey && cacheRef.current.has(cacheKey)) {
      cleanCache(cacheKey);

      if (activeKey === cacheKey) {
        setActiveKey(null);
      }
      forceUpdate((v) => v + 1);
    }

    // 添加应该缓存的组件（首次创建 wrapper 并 portal）
    if (shouldCache && cacheKey && !cacheRef.current.has(cacheKey)) {
      cacheRef.current.set(cacheKey, children as ReactElement);

      // 创建 wrapper DOM 并挂到 offscreen（初始隐藏）
      if (typeof document !== 'undefined' && !cacheContainerRef.current.has(cacheKey)) {
        const wrapper = document.createElement('div');

        wrapper.style.display = 'contents';
        wrapper.setAttribute('data-keepalive-wrapper', String(cacheKey));

        // append 到全局 offscreen 容器（若不可用则 append 到 body）
        (globalOffscreenContainer ?? document.body).appendChild(wrapper);
        cacheContainerRef.current.set(cacheKey, wrapper);
      }

      // LRU 驱逐
      if (cacheRef.current.size > Number(max)) {
        const oldestKey = cacheRef.current.keys().next().value;
        if (oldestKey) {
          cleanCache(oldestKey);
        }
      }

      forceUpdate((v) => v + 1);
    }
  }, [shouldCache, cacheKey, children, max, activeKey]);

  // 更新活跃 key
  useEffect(() => {
    if (shouldCache && cacheKey && activeKey !== cacheKey) {
      setActiveKey(cacheKey);
    } else if (!shouldCache && activeKey !== null) {
      setActiveKey(null);
    }
  }, [shouldCache, cacheKey, activeKey]);

  // 处理生命周期事件和可见性（visibleKeys 主要用于记录用于控制样式）
  useEffect(() => {
    const prev = prevActiveKeyRef.current;
    const next = activeKey;

    if (prev && prev !== next) {
      // 隐藏前一个活跃组件（样式层面）
      setVisibleKeys((prevVisible) => {
        const newVisible = new Set(prevVisible);
        newVisible.delete(prev);
        return newVisible;
      });
      Promise.resolve().then(() => {
        lifeValueRef.current.notifyDeactivate(prev);
      });
    }

    if (next) {
      // 显示当前活跃组件，隐藏其他所有
      setVisibleKeys(new Set([next]));
      Promise.resolve().then(() => {
        lifeValueRef.current.notifyActivate(next);
      });
    } else {
      setVisibleKeys(new Set());
    }

    prevActiveKeyRef.current = next;
  }, [activeKey]);

  // 在 activeKey 变化时，把对应的 wrapper 从 offscreen 移到 host（或反向移回 offscreen）
  useEffect(() => {
    if (typeof document === 'undefined') return;

    for (const [key, wrapper] of cacheContainerRef.current.entries()) {
      if (!wrapper) continue;
      if (key === activeKey) {
        // append 到 host（显示）
        if (hostRef.current && wrapper.parentElement !== hostRef.current) {
          hostRef.current.appendChild(wrapper);
        }
      } else {
        // 移回 offscreen（隐藏）
        const target = globalOffscreenContainer ?? document.body;
        if (wrapper.parentElement !== target) {
          target.appendChild(wrapper);
        }
      }
    }
  }, [activeKey]);

  // 如果当前组件不应该缓存，直接渲染 children
  const renderNonCached = useMemo(
    () => (!shouldCache && !activeKey ? children : null),
    [activeKey, children, shouldCache],
  );

  // 所有缓存项都 portal 到各自 wrapper（wrapper 已由上面的 effect 在 host/offscreen 之间移动）
  const renderCachedToPortal = useCallback(() => {
    const elems = [...cacheRef.current.entries()];

    return elems.map(([k, el]) => {
      const wrapper = cacheContainerRef.current.get(k);
      // wrapper 可能暂时未创建（SSR 或刚创建），过滤掉
      if (!wrapper) return null;
      return createPortal(
        <InnerKeyContext.Provider key={k} value={k}>
          {el}
        </InnerKeyContext.Provider>,
        wrapper,
      );
    });
  }, []);

  // KeepAlive 在页面中的实际渲染位置：一个 host 容器，active wrapper 会被移动到这里
  const renderHost = <div ref={hostRef} data-keepalive-host style={{ display: 'contents' }} />;

  return (
    <KeepAliveLifeContext.Provider value={lifeValueRef.current}>
      {renderNonCached}
      {renderHost}
      {renderCachedToPortal()}
    </KeepAliveLifeContext.Provider>
  );
});
