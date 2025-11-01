import {
  JSX,
  memo,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface EddieSuspenseProps {
  children: ReactNode;

  timeout?: number;

  /**
   * Whether it can be suspended, the default is true. When set to false, Suspense will directly render the default slot content
   */
  suspensible?: boolean;

  /**
   * Triggered when entering the suspended state
   */
  onPending?: () => void;

  /**
   * Triggered when the default slot content parsing is completed
   */
  onResolve?: () => void;

  /**
   * Triggered when the fallback content is displayed
   */
  onFallback?: () => void;

  /**
   * Content displayed in the loading state
   */
  fallback: ReactNode;
}

export default memo(EddieSuspense);

function EddieSuspense(props: EddieSuspenseProps): JSX.Element {
  const {
    children,
    timeout,
    suspensible = true,
    onPending,
    onResolve,
    onFallback,
    fallback,
  } = props;

  const [showFallback, setShowFallback] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const hasPendingRef = useRef(false);
  const hasResolvedRef = useRef(false);

  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 清理 timeout
  useEffect(() => {
    const callback = () => {
      if (!hasResolvedRef.current) {
        // 如果内容还没准备好
        setShowFallback(true);
        onFallback?.();
      }
    };
    timeoutRef.current = setTimeout(callback, timeout);
    return cleanup;
  }, [onFallback, timeout]);

  // 如果 suspensible 为 false，直接渲染子组件
  if (!suspensible) {
    return <>{children}</>;
  }

  // 处理 Suspense 解析
  const handleResolve = () => {
    if (hasResolvedRef.current) return;

    hasResolvedRef.current = true;
    setShowFallback(false);
    cleanup();
    onResolve?.();
  };

  return (
    <Suspense
      fallback={
        <SuspenseFallback
          fallback={fallback}
          timeout={timeout}
          onPending={onPending}
          onFallback={onFallback}
          showFallback={showFallback}
          setShowFallback={setShowFallback}
          hasPendingRef={hasPendingRef}
          timeoutRef={timeoutRef}
        />
      }
    >
      <SuspenseContent onResolve={handleResolve} children={children} />
    </Suspense>
  );
}

// 处理 fallback 逻辑的组件
const SuspenseFallback: React.FC<{
  fallback: React.ReactNode;
  timeout?: number;
  onPending?: () => void;
  onFallback?: () => void;
  showFallback: boolean;
  setShowFallback: (show: boolean) => void;
  hasPendingRef: React.RefObject<boolean>;
  timeoutRef: React.RefObject<number | null>;
}> = (props) => {
  const {
    fallback,
    timeout,
    onPending,
    onFallback,
    showFallback,
    setShowFallback,
    hasPendingRef,
    timeoutRef,
  } = props;

  useEffect(() => {
    // 只有第一次进入 fallback 时触发 onPending
    if (!hasPendingRef.current) {
      hasPendingRef.current = true;
      onPending?.();
    }

    // 处理 timeout 逻辑
    if (timeout !== undefined && timeout > 0) {
      const callback = () => {
        setShowFallback(true);
        onFallback?.();
      };
      const timer = setTimeout(callback, timeout);
      timeoutRef.current = timer;
    } else {
      // 没有 timeout 或 timeout 为 0，立即显示 fallback
      setShowFallback(true);
      onFallback?.();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{showFallback ? fallback : null}</>;
};

// 处理内容解析的组件
const SuspenseContent: React.FC<{
  children: React.ReactNode;
  onResolve: () => void;
}> = ({ children, onResolve }) => {
  // 如果这个组件被渲染，说明 Suspense 已经解析
  useLayoutEffect(() => {
    onResolve();
  }, [onResolve]);

  return <>{children}</>;
};
