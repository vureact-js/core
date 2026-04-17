import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Suspense } from '../../adapter-components/Suspense';
import { defineAsyncComponent } from '../defineAsyncComponent';

const ResolvedView: React.FC<{ text?: string }> = ({ text = 'resolved' }) => (
  <div data-testid="resolved">{text}</div>
);

const LoadingView: React.FC<{ text?: string }> = ({ text = 'loading' }) => (
  <div data-testid="loading">{text}</div>
);

const ErrorView: React.FC<{ error: Error }> = ({ error }) => (
  <div data-testid="error">{error.message}</div>
);

describe('defineAsyncComponent', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('supports function loader form', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<{ default: React.FC<{ text?: string }> }>((resolve) => {
          setTimeout(() => resolve({ default: ResolvedView }), 30);
        }),
    );

    const AsyncComp = defineAsyncComponent(loader);

    render(<AsyncComp text="from-fn-loader" />);

    expect(screen.queryByTestId('resolved')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(30);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('from-fn-loader');
    });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('supports options loader form and direct component result', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<React.FC<{ text?: string }>>((resolve) => {
          setTimeout(() => resolve(ResolvedView), 20);
        }),
    );

    const AsyncComp = defineAsyncComponent({
      loader,
      loadingComponent: LoadingView,
      delay: 0,
    });

    render(<AsyncComp text="options-loader" />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('options-loader');
    });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('respects delay before showing loadingComponent', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<{ default: React.FC<{ text?: string }> }>((resolve) => {
          setTimeout(() => resolve({ default: ResolvedView }), 120);
        }),
    );

    const AsyncComp = defineAsyncComponent({
      loader,
      loadingComponent: LoadingView,
      delay: 60,
    });

    render(<AsyncComp text="after-delay" />);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(60);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('after-delay');
    });
  });

  test('renders errorComponent when timeout is reached', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(() => new Promise(() => {}));

    const AsyncComp = defineAsyncComponent({
      // @ts-ignore
      loader,
      errorComponent: ErrorView,
      timeout: 40,
    });

    render(<AsyncComp />);

    act(() => {
      jest.advanceTimersByTime(40);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Async component timed out after 40ms.',
      );
    });
  });

  test('supports onError retry with attempts=1 on first failure', async () => {
    const loader = jest
      .fn<Promise<{ default: React.FC<{ text?: string }> }>, []>()
      .mockRejectedValueOnce(new Error('first-fail'))
      .mockResolvedValueOnce({ default: ResolvedView });

    const onError = jest.fn(
      (error: Error, retry: () => void, _fail: () => void, attempts: number) => {
        expect(error.message).toBe('first-fail');
        expect(attempts).toBe(1);
        retry();
      },
    );

    const AsyncComp = defineAsyncComponent({
      loader,
      onError,
      loadingComponent: LoadingView,
      delay: 0,
    });

    render(<AsyncComp text="retried-ok" />);

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('retried-ok');
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test('supports onError fail and renders errorComponent', async () => {
    const loader = jest
      .fn<Promise<{ default: React.FC<{ text?: string }> }>, []>()
      .mockRejectedValue(new Error('hard-fail'));

    const onError = jest.fn((_error: Error, _retry: () => void, fail: () => void) => {
      fail();
    });

    const AsyncComp = defineAsyncComponent({
      loader,
      onError,
      errorComponent: ErrorView,
      loadingComponent: LoadingView,
      delay: 0,
    });

    render(<AsyncComp />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('hard-fail');
    });

    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('deduplicates concurrent loader requests', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<{ default: React.FC<{ text?: string }> }>((resolve) => {
          setTimeout(() => resolve({ default: ResolvedView }), 25);
        }),
    );

    const AsyncComp = defineAsyncComponent(loader);

    render(
      <>
        <AsyncComp text="A" />
        <AsyncComp text="B" />
      </>,
    );

    act(() => {
      jest.advanceTimersByTime(25);
    });

    await waitFor(() => {
      const all = screen.getAllByTestId('resolved');
      expect(all).toHaveLength(2);
    });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('reuses resolved component cache across remounts', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<{ default: React.FC<{ text?: string }> }>((resolve) => {
          setTimeout(() => resolve({ default: ResolvedView }), 15);
        }),
    );

    const AsyncComp = defineAsyncComponent(loader);

    const firstRender = render(<AsyncComp text="first-pass" />);

    act(() => {
      jest.advanceTimersByTime(15);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('first-pass');
    });

    firstRender.unmount();

    render(<AsyncComp text="second-pass" />);

    expect(screen.getByTestId('resolved')).toHaveTextContent('second-pass');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  test('suspensible=true suspends in runtime Suspense boundary', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<{ default: React.FC<{ text?: string }> }>((resolve) => {
          setTimeout(() => resolve({ default: ResolvedView }), 20);
        }),
    );

    const AsyncComp = defineAsyncComponent({
      loader,
      loadingComponent: LoadingView,
      delay: 0,
      suspensible: true,
    });

    render(
      <Suspense fallback={<div data-testid="fallback">fallback</div>}>
        <AsyncComp text="inside-suspense" />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('inside-suspense');
    });
  });

  test('outside runtime Suspense or suspensible=false uses local loading/error flow', async () => {
    jest.useFakeTimers();

    const loader = jest.fn(
      () =>
        new Promise<{ default: React.FC<{ text?: string }> }>((resolve) => {
          setTimeout(() => resolve({ default: ResolvedView }), 20);
        }),
    );

    const AsyncComp = defineAsyncComponent({
      loader,
      loadingComponent: LoadingView,
      delay: 0,
      suspensible: false,
    });

    render(
      <Suspense fallback={<div data-testid="fallback">fallback</div>}>
        <AsyncComp text="local-flow" />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('local-flow');
    });

    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('local-flow');
    });
  });

  test('hydrate option is no-op and warns once in development', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const loader = jest
      .fn<Promise<{ default: React.FC<{ text?: string }> }>, []>()
      .mockResolvedValue({
        default: ResolvedView,
      });

    const AsyncComp = defineAsyncComponent({
      loader,
      hydrate: () => () => {},
      delay: 0,
      loadingComponent: LoadingView,
    });

    render(
      <>
        <AsyncComp text="A" />
        <AsyncComp text="B" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('resolved')).toHaveLength(2);
    });

    const hydrateWarnings = warnSpy.mock.calls.filter(([message]) =>
      String(message).includes('`hydrate` option is currently a no-op'),
    );

    expect(hydrateWarnings).toHaveLength(1);
  });
});
