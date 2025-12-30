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
import { TransitionGroup as ReactTransitionGroup, SwitchTransition } from 'react-transition-group';
import { useTransitionConfig } from '../hooks/useTransitionConfig';
import BaseTransition, { TransitionProps as BaseTransitionProps } from './BaseTransition';

export interface TransitionProps extends PropsWithChildren<BaseTransitionProps> {
  /**
   * Controls the timing sequence of leaving/entering transitions.
   * Default behavior is simultaneous.
   */
  mode?: 'in-out' | 'out-in';
}

export default memo(Transition);

/**
 * Equivalent to Vue `<Transition>` components, with the same props and usage.
 *
 * @see https://vureact.vercel.app/en/adapter-components/transition
 */
function Transition(props: TransitionProps) {
  const { mode, children, ...rest } = props;

  if (Children.count(children) > 1) {
    console.error('[Transition error] expected to receive a single React element child.');
    return children;
  }

  const transitionConfig = useTransitionConfig(rest);

  const [forceUpdate, setForceUpdate] = useState(0);

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) return;
    setForceUpdate((c) => c + 1);
  }, [children]);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  const staticState = useRef(true);
  const dynamicState = useMemo(() => !!(forceUpdate % 2), [forceUpdate]);

  const childArray = Children.toArray(children) as ReactElement[];

  const transition = useMemo(
    () =>
      childArray.map((child, i) => {
        const key = (child as ReactElement)?.key ?? `tg-${i}`;
        return (
          <BaseTransition
            key={key}
            show={!mode ? staticState.current : dynamicState}
            __USE_THE_CONFIGURED_PROPS
            {...transitionConfig}
          >
            {child}
          </BaseTransition>
        );
      }),
    [childArray, dynamicState, mode, transitionConfig],
  );

  // if passed the mode option, using SwitchTransition to control 'out-in' and 'in-out'
  if (mode) {
    const onlyChild = transition[0] ?? null;
    return <SwitchTransition mode={mode}>{onlyChild!}</SwitchTransition>;
  }

  return (
    <ReactTransitionGroup
      component={null}
      appear={transitionConfig.appear}
      enter={transitionConfig.enter}
      exit={transitionConfig.exit}
    >
      {transition}
    </ReactTransitionGroup>
  );
}
