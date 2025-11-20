import { type ErrorInfo, memo, type PropsWithChildren } from 'react';
import {
  type ErrorBoundaryPropsWithComponent,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';

export interface ErrorBoundaryProps extends PropsWithChildren {
  /**
   * When the key changes, it will automatically attempt to re-render the child components.
   */
  keys?: any[];
  /**
   * Accepts a component to display when an error is caught.
   *
   * @example
   *
   * ```tsx
   * <ErrorBoundary fallback={({ error, resetErrorBoundary }) => (
   *   <>
   *     <p>{(error as Error).message}</p>
   *     <button onClick={resetErrorBoundary}>reset</button>
   *   </>
   * )}>
   *   ...
   * </ErrorBoundary>
   * ```
   */
  fallback?: ErrorBoundaryPropsWithComponent['FallbackComponent'];
  onErrorCaptured?: (error: Error, info: ErrorInfo) => void;
  /**
   * It can be used to perform recovery operations such as state reset.
   */
  onReset?: (
    details:
      | {
          reason: 'imperative-api';
          args: any[];
        }
      | {
          reason: 'keys';
          prev: any[] | undefined;
          next: any[] | undefined;
        },
  ) => void;
}

export default memo(ErrorBoundary);

/**
 * Secondary encapsulation based on `react-error-boundary`
 */
function ErrorBoundary(props: ErrorBoundaryProps) {
  const { keys, fallback, children, onErrorCaptured, onReset } = props;

  return (
    <ReactErrorBoundary
      resetKeys={keys}
      onReset={onReset}
      onError={onErrorCaptured}
      FallbackComponent={!fallback ? ({ error }) => <div>{error?.message}</div> : fallback}
    >
      {children}
    </ReactErrorBoundary>
  );
}
