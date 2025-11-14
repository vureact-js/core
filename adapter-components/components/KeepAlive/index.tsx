import {
  Children,
  memo,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { getComponentName, getReactType } from '../../utils';
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

/** 全局离屏容器：所有 KeepAlive 共享同一个，用于挂载非激活组件 */
const globalOffscreenContainer: HTMLElement | null =
  typeof document !== 'undefined'
    ? (() => {
        const div = document.createElement('div');
        div.style.cssText =
          'position:fixed;left:-99999px;top:-99999px;width:0;height:0;overflow:hidden;';
        document.body.appendChild(div);
        return div;
      })()
    : null;

export { useActived, useDeactived, type KeepAliveProps, type MatchPattern };
export default memo(KeepAlive);

/**
 * Equivalent to  KeepAlive components, with the same usage.
 */
function KeepAlive(props: PropsWithChildren<KeepAliveProps>) {
  const { include, exclude, max = 10, children } = props;

  const lifeValueRef = useRef(createKeepAliveLifeContextValue());

  const cacheRef = useRef(new Map<string, ReactElement>());
  const cacheContainerRef = useRef(new Map<string, HTMLDivElement>());

  const prevActiveKeyRef = useRef<string | null>(null);
  const visibleHostRef = useRef<HTMLDivElement | null>(null);

  const [, forceUpdate] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);

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

      // 如果 include 不匹配，直接返回 false
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

  // 缓存管理
  useEffect(() => {
    const cleanCache = (key: string) => {
      lifeValueRef.current.notifyDeactivate(key);
      cacheRef.current.delete(key);

      const wrapper = cacheContainerRef.current.get(key);
      wrapper?.parentNode?.removeChild(wrapper);

      cacheContainerRef.current.delete(key);
    };

    // 清理不应该缓存的组件
    if (!shouldCache && cacheKey && cacheRef.current.has(cacheKey)) {
      cleanCache(cacheKey);

      if (activeKey === cacheKey) {
        setActiveKey(null);
      }

      forceUpdate((v) => v + 1);
    }

    // 添加应该缓存的组件
    if (shouldCache && cacheKey && !cacheRef.current.has(cacheKey)) {
      cacheRef.current.set(cacheKey, children as ReactElement);

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

  useEffect(() => {
    if (shouldCache && cacheKey && activeKey !== cacheKey) {
      setActiveKey(cacheKey);
    } else if (!shouldCache && activeKey !== null) {
      // 当切换到排除组件时，清空 activeKey
      setActiveKey(null);
    }
  }, [shouldCache, cacheKey, activeKey]);

  useEffect(() => {
    const prev = prevActiveKeyRef.current;
    const next = activeKey;

    const showWrapper = (k: string) => {
      const wrapper = cacheContainerRef.current.get(k);
      const host = visibleHostRef.current;
      if (wrapper && host && wrapper.parentNode !== host) {
        host.appendChild(wrapper);
      }
    };

    const hideWrapper = (k: string) => {
      const wrapper = cacheContainerRef.current.get(k);
      if (wrapper && globalOffscreenContainer && wrapper.parentNode !== globalOffscreenContainer) {
        globalOffscreenContainer.appendChild(wrapper);
      }
    };

    // 确保所有非活跃缓存组件都在离屏容器中
    const hideAllExcept = (exceptKey: string | null) => {
      Array.from(cacheRef.current.keys()).forEach((k) => {
        if (k !== exceptKey) {
          hideWrapper(k);
        }
      });
    };

    if (prev && prev !== next) {
      // 隐藏前一个活跃组件
      hideWrapper(prev);
      Promise.resolve().then(() => {
        lifeValueRef.current.notifyDeactivate(prev);
      });
    }

    if (next) {
      // 显示当前活跃组件，隐藏其他所有
      showWrapper(next);
      hideAllExcept(next);
      Promise.resolve().then(() => {
        lifeValueRef.current.notifyActivate(next);
      });
    } else {
      // 没有活跃组件（切换到排除组件），隐藏所有缓存组件
      hideAllExcept(null);
    }

    prevActiveKeyRef.current = next;
  }, [activeKey]);

  return (
    <KeepAliveLifeContext.Provider value={lifeValueRef.current}>
      <div ref={visibleHostRef} className="keepalive-visible-host" />

      {/* 如果当前组件不应该缓存，直接渲染 children */}
      {!shouldCache && children}

      {/* 总是渲染所有缓存的组件到各自的 portal */}
      {[...cacheRef.current.entries()].map(([k, element]) => {
        let wrapper = cacheContainerRef.current.get(k);
        if (!wrapper) {
          wrapper = document.createElement('div');
          wrapper.setAttribute('data-keepalive-wrapper', k);
          // 初始状态：所有缓存组件都在离屏容器中
          if (globalOffscreenContainer) globalOffscreenContainer.appendChild(wrapper);
          cacheContainerRef.current.set(k, wrapper);
        }

        return createPortal(
          <InnerKeyContext.Provider key={k} value={k}>
            {element}
          </InnerKeyContext.Provider>,
          wrapper,
        );
      })}
    </KeepAliveLifeContext.Provider>
  );
}
