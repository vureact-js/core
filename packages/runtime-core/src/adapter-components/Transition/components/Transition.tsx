import { Children, memo, PropsWithChildren, ReactElement, useMemo } from 'react';
import { TransitionGroup as ReactTransitionGroup, SwitchTransition } from 'react-transition-group';
import { useTransitionConfig } from '../hooks/useTransitionConfig';
import BaseTransition, { BaseTransitionProps } from './BaseTransition';

export interface TransitionProps extends PropsWithChildren<BaseTransitionProps> {
  mode?: 'in-out' | 'out-in';
}

/**
 * React adapter for Vue's built-in component `<transition>`.
 * @see https://runtime.vureact.top/guide/components/transition.html
 */
export const Transition = memo((props: TransitionProps) => {
  const { mode, children, ...rest } = props;

  const childArray = Children.toArray(children) as ReactElement[];

  if (childArray.length > 1) {
    // eslint-disable-next-line no-console
    console.error('[Transition error] expected to receive a single React element child.');
    return children;
  }

  const transitionConfig = useTransitionConfig(rest);
  const child = childArray[0] ?? null;

  if (mode) {
    if (!child) {
      return null;
    }

    const key = child?.key?.toString() ?? '__transition-empty__';

    return (
      <SwitchTransition mode={mode}>
        <BaseTransition
          key={key}
          __USE_THE_CONFIGURED_PROPS
          {...(transitionConfig as TransitionProps)}
        >
          {child}
        </BaseTransition>
      </SwitchTransition>
    );
  }

  const transitionChildren = useMemo(() => {
    if (!child) {
      return null;
    }

    const key = child.key?.toString() ?? '__transition-default__';

    return (
      <BaseTransition
        key={key}
        __USE_THE_CONFIGURED_PROPS
        {...(transitionConfig as TransitionProps)}
      >
        {child}
      </BaseTransition>
    );
  }, [child, transitionConfig]);

  return <ReactTransitionGroup component={null}>{transitionChildren}</ReactTransitionGroup>;
});
