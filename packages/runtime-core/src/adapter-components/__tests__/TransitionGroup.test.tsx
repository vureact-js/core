import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { TransitionGroup } from '../Transition/components/TransitionGroup';

describe('TransitionGroup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders list items and supports add/remove transitions', async () => {
    function Host() {
      const [items, setItems] = React.useState(['a', 'b']);

      return (
        <>
          <button data-testid="add" onClick={() => setItems((prev) => [...prev, 'c'])}>
            add
          </button>
          <button data-testid="remove" onClick={() => setItems((prev) => prev.slice(1))}>
            remove
          </button>
          <TransitionGroup duration={0} tag="ul" htmlProps={{ 'data-testid': 'group' }}>
            {items.map((item) => (
              <li key={item} data-testid={`item-${item}`}>
                {item}
              </li>
            ))}
          </TransitionGroup>
        </>
      );
    }

    render(<Host />);

    expect(screen.getByTestId('item-a')).toBeInTheDocument();
    expect(screen.getByTestId('item-b')).toBeInTheDocument();
    expect(screen.getByTestId('group').tagName).toBe('UL');

    act(() => {
      screen.getByTestId('add').click();
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-c')).toBeInTheDocument();
    });

    act(() => {
      screen.getByTestId('remove').click();
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('item-a')).not.toBeInTheDocument();
    });
  });

  test('warns when child keys are missing', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <TransitionGroup duration={0}>
        <div data-testid="nokey-1">1</div>
        <div data-testid="nokey-2">2</div>
      </TransitionGroup>,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[TransitionGroup] Child element is missing a stable key;'),
    );

    spy.mockRestore();
  });

  test('accepts moveClass option without breaking rendering', () => {
    render(
      <TransitionGroup duration={0} moveClass="move-x" tag="div" htmlProps={{ 'data-testid': 'move-host' }}>
        <div key="1" data-testid="move-1">
          one
        </div>
        <div key="2" data-testid="move-2">
          two
        </div>
      </TransitionGroup>,
    );

    expect(screen.getByTestId('move-host')).toBeInTheDocument();
    expect(screen.getByTestId('move-1')).toBeInTheDocument();
    expect(screen.getByTestId('move-2')).toBeInTheDocument();
  });
});
