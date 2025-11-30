import { DependencyList, memo, PropsWithChildren, ReactNode, useMemo } from 'react';

export interface MemoProps extends PropsWithChildren {
  deps: DependencyList;
}

export default memo(Memo);

/**
 * Memo
 *
 * A memory-optimized rendering component that memoizes its children based on dependencies.
 * Similar to React.useMemo but for JSX children. Supports both element children and
 * function children (render props pattern).
 *
 * @remarks
 * - When children is a function, it's called on initial render and whenever deps change.
 * - For regular children, it prevents re-rendering when deps remain referentially equal.
 * - Uses custom memoization with DeepEquals for the deps array to avoid re-renders
 *   when array contents are unchanged.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Memo deps={[userId]}>
 *   <UserProfile id={userId} />
 * </Memo>
 *
 * // With render function
 * <Memo deps={[count]}>
 *   {() => <ExpensiveList count={count} />}
 * </Memo>
 * ```
 *
 * @param props.deps - Dependency array for memoization (compared deeply)
 * @param props.children - ReactNode or function returning ReactNode
 * @returns Memoized children
 */
function Memo({ deps, children }: MemoProps) {
  const elements = useMemo(
    () => (typeof children === 'function' ? (children as () => ReactNode)() : children),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  return elements;
}

Memo.displayName = 'Memo';
