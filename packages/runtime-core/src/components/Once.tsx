import { PropsWithChildren } from 'react';
import Memo from './Memo';

export default Once;

/**
 * Once
 *
 * A specialized Memo component that renders children only once during the component lifecycle.
 * Equivalent to `<Memo deps={[]}>`.
 *
 * @remarks
 * - Children are evaluated once on mount and never re-rendered, even if parent re-renders.
 * - Useful for expensive static content or initialization logic.
 *
 * @example
 * ```tsx
 * <Once>
 *   <ExpensiveInitialChart />
 * </Once>
 * ```
 *
 * @param props.children - Content to render once
 * @returns Children evaluated once
 */
function Once({ children }: PropsWithChildren) {
  return <Memo deps={[]}>{children}</Memo>;
}

Once.displayName = 'Once';
