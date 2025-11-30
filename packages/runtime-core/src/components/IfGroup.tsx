import { Children, isValidElement, memo, PropsWithChildren, ReactElement } from 'react';
import { getComponentName } from '../shared';

export interface IfGroupProps extends PropsWithChildren {
  conditions: boolean[];
}

const IF = 'If';
const ELSE = 'Else';
const ELSE_IF = 'ElseIf';

export default memo(IfGroup);

/**
 * IfGroup
 *
 * A conditional rendering component that mimics Vue's v-if/v-else-if/v-else behavior.
 * It accepts an array of boolean conditions and renders the first child component
 * whose corresponding condition is true. If all conditions are false, it renders
 * the `<Else>` component if present, otherwise returns null.
 *
 * @remarks
 * - The first child must be an <If> component.
 * - The order must be: `<If>`, then zero or more `<ElseIf>`, then optionally one `<Else>`.
 * - Each condition corresponds to a child by index position.
 * - Uses memoization with custom equality check to prevent unnecessary re-renders
 *   when conditions array contents haven't changed.
 *
 * @example
 * ```tsx
 * <IfGroup conditions={[user.isAdmin, user.isModerator]}>
 *   <If><AdminPanel /></If>
 *   <ElseIf><ModeratorPanel /></ElseIf>
 *   <Else><UserPanel /></Else>
 * </IfGroup>
 * ```
 *
 * @param props.conditions - Array of boolean conditions corresponding to each child component
 * @param props.children - Must be If, ElseIf, and Else components in correct order
 * @returns The first matching child component or null
 * @throws {SyntaxError} If children are not If/ElseIf/Else, or if first child is not If,
 *         or if Else appears before ElseIf
 */
function IfGroup({ children, conditions }: IfGroupProps) {
  const snapshot = [...conditions];
  const arr = Children.toArray(children) as ReactElement[];

  if (!arr.length) return null;

  if (arr.some((c) => !isValidElement(c))) {
    throw SyntaxError(
      '[IfGroup] the children of <IfGroup> can only contain <If>, <ElseIf>, and <Else> components',
    );
  }

  if (getComponentName(arr[0]) !== IF) {
    throw SyntaxError('[IfGroup] missing the required <If> component');
  }

  const isAllFalse = snapshot.every((cond) => !cond);

  for (let i = 0; i < arr.length; i++) {
    const child = arr[i];
    const cond = snapshot[i];

    if (getComponentName(child) === IF) {
      if (cond) {
        return child;
      }
      continue;
    }

    if (getComponentName(child) === ELSE_IF) {
      const prevChild = arr[i - 1];
      if (getComponentName(prevChild) === ELSE) {
        throw SyntaxError('[IfGroup] unexpected component <Else>');
      }

      // 检查前面所有条件都为 false
      const prevConditionsAllFalse = snapshot.slice(0, i).every((c) => !c);
      if (cond && prevConditionsAllFalse) {
        return child;
      }

      continue;
    }

    if (getComponentName(child) === ELSE && isAllFalse) {
      return child;
    }
  }

  return null;
}

/**
 * If
 *
 * Wrapper component that marks a branch for conditional rendering in IfGroup.
 * Must be the first child of IfGroup.
 *
 * @example
 * ```tsx
 * <If><AdminPanel /></If>
 * ```
 */
export const If: React.FC<PropsWithChildren> = ({ children }) => {
  return children;
};

If.displayName = 'If';

/**
 * ElseIf
 *
 * Wrapper component that marks a conditional branch in IfGroup.
 * Renders when all previous conditions are false and its own condition is true.
 * Must appear after If and before Else.
 *
 * @example
 * ```tsx
 * <ElseIf><ModeratorPanel /></ElseIf>
 * ```
 */
export const ElseIf: React.FC<PropsWithChildren> = ({ children }) => {
  return children;
};

ElseIf.displayName = 'ElseIf';

/**
 * Else
 *
 * Wrapper component that marks the fallback branch in IfGroup.
 * Renders only when all conditions are false.
 * Must be the last child if present.
 *
 * @example
 * ```tsx
 * <Else><UserPanel /></Else>
 * ```
 */
export const Else: React.FC<PropsWithChildren> = ({ children }) => {
  return children;
};

Else.displayName = 'Else';
