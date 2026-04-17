import { useLayoutEffect, type ReactNode } from 'react';

export const SuspenseContent: React.FC<{
  children: ReactNode;
  onResolve: () => void;
}> = ({ children, onResolve }) => {
  useLayoutEffect(() => {
    onResolve();
  }, [onResolve]);

  return <>{children}</>;
};
