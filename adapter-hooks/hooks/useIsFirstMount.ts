import { useEffect, useRef } from 'react';

export function useIsFirstMount(): boolean {
  const isFirstMount = useRef(true);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  // eslint-disable-next-line react-hooks/refs
  return isFirstMount.current;
}
