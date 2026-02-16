import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Suspense } from '../Suspense';

function createLazyComponent(delay = 50, text = 'resolved') {
  return React.lazy(
    () =>
      new Promise<{ default: React.FC }>((resolve) => {
        setTimeout(() => {
          resolve({ default: () => <div data-testid="resolved">{text}</div> });
        }, delay);
      }),
  );
}

describe('Suspense', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('triggers pending/fallback/resolve in a complete async cycle', async () => {
    const LazyComp = createLazyComponent(30, 'ok');

    const onPending = jest.fn();
    const onFallback = jest.fn();
    const onResolve = jest.fn();

    render(
      <Suspense
        fallback={<div data-testid="fallback">loading</div>}
        timeout={10}
        onPending={onPending}
        onFallback={onFallback}
        onResolve={onResolve}
      >
        <LazyComp />
      </Suspense>,
    );

    expect(onPending).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('fallback')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(30);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('ok');
    });

    expect(onResolve).toHaveBeenCalledTimes(1);
  });

  test('does not show fallback before timeout', async () => {
    const LazyComp = createLazyComponent(20, 'late');

    render(
      <Suspense fallback={<div data-testid="fallback">loading</div>} timeout={100}>
        <LazyComp />
      </Suspense>,
    );

    act(() => {
      jest.advanceTimersByTime(30);
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved')).toHaveTextContent('late');
    });

    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  test('when suspensible is false renders children directly', () => {
    render(
      <Suspense fallback={<div data-testid="fallback">loading</div>} suspensible={false}>
        <div data-testid="plain">plain</div>
      </Suspense>,
    );

    expect(screen.getByTestId('plain')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  test('fallback callback fires once per cycle', () => {
    const LazyComp = createLazyComponent(100, 'cycle');
    const onFallback = jest.fn();

    render(
      <Suspense fallback={<div data-testid="fallback">loading</div>} timeout={0} onFallback={onFallback}>
        <LazyComp />
      </Suspense>,
    );

    expect(onFallback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(30);
    });

    expect(onFallback).toHaveBeenCalledTimes(1);
  });
});
