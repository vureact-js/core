import { useLayoutEffect, type ReactNode } from 'react';

export const SuspenseFallback: React.FC<{
  fallback: ReactNode;
  showFallback: boolean;
  startPendingCycle: () => void;
}> = ({ fallback, showFallback, startPendingCycle }) => {
  useLayoutEffect(() => {
    startPendingCycle();
  }, [startPendingCycle]);

  return <>{showFallback ? fallback : null}</>;
};
