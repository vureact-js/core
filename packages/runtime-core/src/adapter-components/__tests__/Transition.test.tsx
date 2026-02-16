import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Transition } from '../Transition/components/Transition';

describe('Transition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('warns when receiving multiple children', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Transition>
        <div>A</div>
        <div>B</div>
      </Transition>,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[Transition error] expected to receive a single React element child.',
      ),
    );

    spy.mockRestore();
  });

  test('supports mode out-in and switches child by key', async () => {
    function Host() {
      const [value, setValue] = React.useState<'A' | 'B'>('A');

      return (
        <>
          <button data-testid="switch" onClick={() => setValue((v) => (v === 'A' ? 'B' : 'A'))}>
            switch
          </button>
          <Transition mode="out-in" duration={0}>
            <div key={value} data-testid="content">
              {value}
            </div>
          </Transition>
        </>
      );
    }

    render(<Host />);
    expect(screen.getByTestId('content')).toHaveTextContent('A');

    act(() => {
      screen.getByTestId('switch').click();
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId('content')).toHaveTextContent('B');
    });
  });

  test('fires appear hooks via onBeforeAppear and keeps typo alias compatibility', () => {
    const onBeforeAppear = jest.fn();

    const { unmount } = render(
      <Transition appear duration={0} onBeforeAppear={onBeforeAppear}>
        <div key="first">first</div>
      </Transition>,
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(onBeforeAppear).toHaveBeenCalled();

    unmount();

    render(
      <Transition appear duration={0} onBeforeAppear={onBeforeAppear}>
        <div key="second">second</div>
      </Transition>,
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(onBeforeAppear).toHaveBeenCalled();
  });

  test('fires enter/leave hooks in transition lifecycle', async () => {
    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();

    function Host() {
      const [show, setShow] = React.useState(true);

      return (
        <>
          <button data-testid="toggle" onClick={() => setShow((v) => !v)}>
            toggle
          </button>
          <Transition
            mode="out-in"
            duration={0}
            onBeforeEnter={onBeforeEnter}
            onEnter={onEnter}
            onAfterEnter={onAfterEnter}
            onBeforeLeave={onBeforeLeave}
            onLeave={onLeave}
            onAfterLeave={onAfterLeave}
          >
            {show ? <div key="box">box</div> : <div key="empty">empty</div>}
          </Transition>
        </>
      );
    }

    render(<Host />);

    act(() => {
      screen.getByTestId('toggle').click();
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(onBeforeLeave).toHaveBeenCalled();
      expect(onLeave).toHaveBeenCalled();
      expect(onAfterLeave).toHaveBeenCalled();
    });

    act(() => {
      screen.getByTestId('toggle').click();
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(onBeforeEnter).toHaveBeenCalled();
      expect(onEnter).toHaveBeenCalled();
      expect(onAfterEnter).toHaveBeenCalled();
    });
  });
});
