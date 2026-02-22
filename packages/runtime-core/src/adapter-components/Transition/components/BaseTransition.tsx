import {
  Children,
  cloneElement,
  ForwardedRef,
  isValidElement,
  memo,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { CSSTransition } from 'react-transition-group';
import { CSSTransitionProps } from 'react-transition-group/CSSTransition';
import {
  CommonTransitionProps,
  TransitionConfig,
  useTransitionConfig,
} from '../hooks/useTransitionConfig';

export interface BaseTransitionProps extends CommonTransitionProps {
  show?: boolean;
  in?: boolean;
  __USE_THE_CONFIGURED_PROPS?: boolean;
  onStateChange?: (key: string, state: TransitionState) => void;
}

export type TransitionState = 'idle' | 'entering' | 'leaving';

export default memo(BaseTransition);

function BaseTransition(props: PropsWithChildren<BaseTransitionProps>) {
  const {
    children,
    show,
    in: inFromGroup,
    onEnterCancelled,
    onLeaveCancelled,
    onStateChange,
    __USE_THE_CONFIGURED_PROPS,
    ...restProps
  } = props;

  const child = Children.only(children);

  const transitionConfig = __USE_THE_CONFIGURED_PROPS
    ? (restProps as TransitionConfig)
    : useTransitionConfig(restProps);

  const stateRef = useRef<TransitionState>('idle');
  const nodeRef = useRef<HTMLElement | null>(null);

  const originalKey = useMemo(() => (child as ReactElement).key?.toString() ?? null, [child]);

  const reportState = useCallback(
    (state: TransitionState) => {
      if (!originalKey) {
        return;
      }

      onStateChange?.(originalKey, state);
    },
    [onStateChange, originalKey],
  );

  const wrappedHandlers = useMemo(
    () => ({
      onEnter: (...args: any[]) => {
        const node = (args[0] instanceof HTMLElement ? args[0] : nodeRef.current)!;
        const isAppearing =
          typeof args[0] === 'boolean' ? args[0] : typeof args[1] === 'boolean' ? args[1] : false;

        if (stateRef.current === 'leaving') {
          onLeaveCancelled?.(node);
        }

        stateRef.current = 'entering';
        reportState('entering');
        transitionConfig.onEnter?.(node, isAppearing);
      },
      onEntering: (...args: any[]) => {
        const node = (args[0] instanceof HTMLElement ? args[0] : nodeRef.current)!;
        const isAppearing =
          typeof args[0] === 'boolean' ? args[0] : typeof args[1] === 'boolean' ? args[1] : false;

        stateRef.current = 'entering';
        reportState('entering');
        transitionConfig.onEntering?.(node, isAppearing);
      },
      onEntered: (...args: any[]) => {
        const node = (args[0] instanceof HTMLElement ? args[0] : nodeRef.current)!;
        const isAppearing =
          typeof args[0] === 'boolean' ? args[0] : typeof args[1] === 'boolean' ? args[1] : false;

        stateRef.current = 'idle';
        reportState('idle');
        transitionConfig.onEntered?.(node, isAppearing);
      },
      onExit: (...args: any[]) => {
        const node = (args[0] instanceof HTMLElement ? args[0] : nodeRef.current)!;

        if (stateRef.current === 'entering') {
          onEnterCancelled?.(node);
        }

        stateRef.current = 'leaving';
        reportState('leaving');
        transitionConfig.onExit?.(node);
      },
      onExiting: (...args: any[]) => {
        const node = (args[0] instanceof HTMLElement ? args[0] : nodeRef.current)!;

        stateRef.current = 'leaving';
        reportState('leaving');
        transitionConfig.onExiting?.(node);
      },
      onExited: (...args: any[]) => {
        const node = (args[0] instanceof HTMLElement ? args[0] : nodeRef.current)!;

        stateRef.current = 'idle';
        reportState('idle');
        transitionConfig.onExited?.(node);
      },
    }),
    [onEnterCancelled, onLeaveCancelled, reportState, transitionConfig],
  );

  const cloneChild = useMemo(() => {
    if (!isValidElement(child)) {
      return child;
    }

    const originalRef = (child as any).ref as ForwardedRef<HTMLElement> | undefined;

    const mergedRef = (instance: HTMLElement | null) => {
      nodeRef.current = instance;

      if (!originalRef) {
        return;
      }

      if (typeof originalRef === 'function') {
        originalRef(instance);
        return;
      }

      (originalRef as { current: HTMLElement | null }).current = instance;
    };

    return cloneElement(child, {
      'data-original-key': originalKey ?? undefined,
      ref: mergedRef,
    } as any);
  }, [child, originalKey]);

  const inValue = inFromGroup ?? show ?? true;

  const cssTransitionProps = useMemo<CSSTransitionProps>(
    () => ({
      ...transitionConfig,
      ...wrappedHandlers,
      in: inValue,
      nodeRef: nodeRef as any,
      mountOnEnter: true,
      unmountOnExit: false,
    }),
    [inValue, transitionConfig, wrappedHandlers],
  );

  return <CSSTransition {...cssTransitionProps}>{cloneChild}</CSSTransition>;
}
