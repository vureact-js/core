import {
  memo,
  Suspense as ReactSuspense,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface SuspenseProps {
  children: ReactNode;
  timeout?: number;
  suspensible?: boolean;
  onPending?: () => void;
  onResolve?: () => void;
  onFallback?: () => void;
  fallback: ReactNode;
}

/**
 * React adapter for Vue's built-in component `<suspense>`.
 * @see https://runtime.vureact.top/guide/components/suspense.html
 */
export const Suspense = memo((props: SuspenseProps) => {
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTriggeredRef = useRef(false);
  const fallbackTriggeredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const emitFallback = useCallback(() => {
    if (fallbackTriggeredRef.current) {
      return;
    }

    fallbackTriggeredRef.current = true;
    setShowFallback(true);
    onFallback?.();
  }, [onFallback]);

  const startPendingCycle = useCallback(() => {
    if (!pendingTriggeredRef.current) {
      pendingTriggeredRef.current = true;
      onPending?.();
    }

    clearTimer();

    if (timeout == null || timeout <= 0) {
      emitFallback();
      return;
    }

    timerRef.current = setTimeout(() => {
      emitFallback();
    }, timeout);
  }, [clearTimer, emitFallback, onPending, timeout]);

  const resolvePendingCycle = useCallback(() => {
    const hadPending = pendingTriggeredRef.current;

    clearTimer();
    setShowFallback(false);

    pendingTriggeredRef.current = false;
    fallbackTriggeredRef.current = false;

    if (hadPending) {
      onResolve?.();
    }
  }, [clearTimer, onResolve]);

  if (!suspensible) {
    return <>{children}</>;
  }

  return (
    <ReactSuspense
      fallback={
        <SuspenseFallback
          fallback={fallback}
          showFallback={showFallback}
          startPendingCycle={startPendingCycle}
        />
      }
    >
      <SuspenseContent onResolve={resolvePendingCycle}>{children}</SuspenseContent>
    </ReactSuspense>
  );
});

const SuspenseFallback: React.FC<{
  fallback: ReactNode;
  showFallback: boolean;
  startPendingCycle: () => void;
}> = ({ fallback, showFallback, startPendingCycle }) => {
  useLayoutEffect(() => {
    startPendingCycle();
  }, [startPendingCycle]);

  return <>{showFallback ? fallback : null}</>;
};

const SuspenseContent: React.FC<{
  children: ReactNode;
  onResolve: () => void;
}> = ({ children, onResolve }) => {
  useLayoutEffect(() => {
    onResolve();
  }, [onResolve]);

  return <>{children}</>;
};
