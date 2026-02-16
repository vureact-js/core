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
import { getComponentName, getReactType } from '../utils';
import { createKeepAliveLifeContextValue, InnerKeyContext, KeepAliveLifeContext } from './context';
import { useActived } from './hooks/useActived';
import { useDeactivated } from './hooks/useDeactivated';
import { matchPattern } from './utils';

interface KeepAliveProps {
  include?: MatchPattern;
  exclude?: MatchPattern;
  max?: number | string;
}

type MatchPattern = string | RegExp | (string | RegExp)[];

export { useActived, useDeactivated, type KeepAliveProps, type MatchPattern };

let globalOffscreenContainer: HTMLElement | null = null;

function getOffscreenContainer() {
  if (typeof document === 'undefined') {
    return null;
  }

  if (globalOffscreenContainer && globalOffscreenContainer.isConnected) {
    return globalOffscreenContainer;
  }

  const container = document.createElement('div');
  container.style.display = 'none';
  container.setAttribute('data-keepalive-offscreen', 'true');
  document.body.appendChild(container);
  globalOffscreenContainer = container;

  return container;
}

function touchCacheEntry(
  map: Map<string, ReactElement>,
  key: string,
  element: ReactElement,
): boolean {
  const hadKey = map.has(key);
  if (hadKey) {
    map.delete(key);
  }

  map.set(key, element);
  return !hadKey;
}

/**
 * React adapter for Vue's built-in component `<keep-alive>`.
 */
export const KeepAlive = memo((props: PropsWithChildren<KeepAliveProps>) => {
  const { include, exclude, max = 10, children } = props;

  const lifeValueRef = useRef(createKeepAliveLifeContextValue());
  const cacheRef = useRef(new Map<string, ReactElement>());
  const wrapperRef = useRef(new Map<string, HTMLElement>());
  const warnedNoKeyRef = useRef(new Set<string>());
  const prevActiveKeyRef = useRef<string | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  if (Children.count(children) !== 1) {
    // eslint-disable-next-line no-console
    console.error('[KeepAlive] There must be only one direct child component.');
    return <>{children}</>;
  }

  const reactType = getReactType(children);

  if (reactType !== 'element' && reactType !== 'component') {
    // eslint-disable-next-line no-console
    console.error('[KeepAlive] The child element must be a component.');
    return <>{children}</>;
  }

  const child = children as ReactElement;
  const compName = getComponentName(child);
  const rawKey = child.key;
  const cacheKey = rawKey != null ? String(rawKey) : compName;

  const shouldCacheByPattern = useMemo(() => {
    if (include) {
      const included = matchPattern(include, compName) || matchPattern(include, cacheKey);
      if (!included) {
        return false;
      }
    }

    if (exclude) {
      const excluded = matchPattern(exclude, compName) || matchPattern(exclude, cacheKey);
      if (excluded) {
        return false;
      }
    }

    return true;
  }, [cacheKey, compName, exclude, include]);

  const shouldCache = !!cacheKey && shouldCacheByPattern;

  if (shouldCache && cacheKey) {
    touchCacheEntry(cacheRef.current, cacheKey, child);
  }

  useEffect(() => {
    if (shouldCacheByPattern && !cacheKey) {
      const warnId = compName ?? '__anonymous__';
      if (!warnedNoKeyRef.current.has(warnId)) {
        warnedNoKeyRef.current.add(warnId);
        // eslint-disable-next-line no-console
        console.warn(
          '[KeepAlive] The child component has no stable key/name and will be rendered without caching.',
        );
      }
    }
  }, [cacheKey, compName, shouldCacheByPattern]);

  useEffect(() => {
    if (!shouldCache || !cacheKey) {
      setActiveKey(null);
      return;
    }

    const offscreen = getOffscreenContainer();
    if (!offscreen) {
      setActiveKey(null);
      return;
    }

    let changed = false;

    if (!wrapperRef.current.has(cacheKey)) {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'contents';
      wrapper.setAttribute('data-keepalive-wrapper', cacheKey);
      offscreen.appendChild(wrapper);
      wrapperRef.current.set(cacheKey, wrapper);
      changed = true;
    }

    const maxCount = Math.max(1, Number(max) || 1);

    while (cacheRef.current.size > maxCount) {
      const oldestKey = cacheRef.current.keys().next().value as string | undefined;
      if (!oldestKey) {
        break;
      }

      if (oldestKey === cacheKey && cacheRef.current.size > 1) {
        const value = cacheRef.current.get(oldestKey)!;
        cacheRef.current.delete(oldestKey);
        cacheRef.current.set(oldestKey, value);
        continue;
      }

      cacheRef.current.delete(oldestKey);
      lifeValueRef.current.notifyDeactivate(oldestKey);

      const wrapper = wrapperRef.current.get(oldestKey);
      if (wrapper) {
        wrapper.remove();
        wrapperRef.current.delete(oldestKey);
      }

      if (prevActiveKeyRef.current === oldestKey) {
        prevActiveKeyRef.current = null;
      }

      changed = true;
    }

    setActiveKey(cacheKey);

    if (changed) {
      setRevision((v) => v + 1);
    }
  }, [cacheKey, max, shouldCache]);

  useEffect(() => {
    const prev = prevActiveKeyRef.current;
    const next = activeKey;

    if (prev === next) {
      return;
    }

    if (prev) {
      lifeValueRef.current.notifyDeactivate(prev);
    }

    if (next) {
      lifeValueRef.current.notifyActivate(next);
    }

    prevActiveKeyRef.current = next;
  }, [activeKey, revision]);

  useEffect(() => {
    const offscreen = getOffscreenContainer();

    if (!offscreen) {
      return;
    }

    for (const [key, wrapper] of wrapperRef.current.entries()) {
      if (!wrapper) {
        continue;
      }

      if (key === activeKey && hostRef.current) {
        if (wrapper.parentElement !== hostRef.current) {
          hostRef.current.appendChild(wrapper);
        }
      } else if (wrapper.parentElement !== offscreen) {
        offscreen.appendChild(wrapper);
      }
    }
  }, [activeKey, revision]);

  useEffect(
    () => () => {
      for (const wrapper of wrapperRef.current.values()) {
        wrapper.remove();
      }

      wrapperRef.current.clear();
      cacheRef.current.clear();
    },
    [],
  );

  const renderCachedPortals = [...cacheRef.current.entries()].map(([key, element]) => {
    const wrapper = wrapperRef.current.get(key);
    if (!wrapper) {
      return null;
    }

    return createPortal(
      <InnerKeyContext.Provider key={key} value={key}>
        {element}
      </InnerKeyContext.Provider>,
      wrapper,
      key,
    );
  });

  const shouldRenderRawChildren = !shouldCache;

  return (
    <KeepAliveLifeContext.Provider value={lifeValueRef.current}>
      {shouldRenderRawChildren ? children : null}
      <div ref={hostRef} data-keepalive-host style={{ display: 'contents' }} />
      {renderCachedPortals}
    </KeepAliveLifeContext.Provider>
  );
});
