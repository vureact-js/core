import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { KeepAlive, useActived, useDeactivated } from '../KeepAlive';

function Counter({ label }: { label: string }) {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <span data-testid={`count-${label}`}>{count}</span>
      <button data-testid={`inc-${label}`} onClick={() => setCount((v) => v + 1)}>
        inc
      </button>
    </div>
  );
}

describe('KeepAlive', () => {
  test('keeps component state when switching back to cached key', async () => {
    const user = userEvent.setup();

    function Host() {
      const [tab, setTab] = React.useState<'A' | 'B'>('A');

      return (
        <>
          <button data-testid="to-a" onClick={() => setTab('A')}>
            A
          </button>
          <button data-testid="to-b" onClick={() => setTab('B')}>
            B
          </button>
          <KeepAlive max={2}>
            <Counter key={tab} label={tab} />
          </KeepAlive>
        </>
      );
    }

    render(<Host />);

    await user.click(screen.getByTestId('inc-A'));
    expect(screen.getByTestId('count-A')).toHaveTextContent('1');

    await user.click(screen.getByTestId('to-b'));
    expect(screen.getByTestId('count-B')).toHaveTextContent('0');

    await user.click(screen.getByTestId('to-a'));
    expect(screen.getByTestId('count-A')).toHaveTextContent('1');
  });

  test('updates cached subtree when same key props change', async () => {
    const user = userEvent.setup();

    function Child({ text }: { text: string }) {
      return <div data-testid="same-key-prop">{text}</div>;
    }

    function Host() {
      const [text, setText] = React.useState('old');

      return (
        <>
          <button data-testid="change" onClick={() => setText('new')}>
            change
          </button>
          <KeepAlive>
            <Child key="same" text={text} />
          </KeepAlive>
        </>
      );
    }

    render(<Host />);

    expect(screen.getByTestId('same-key-prop')).toHaveTextContent('old');

    await user.click(screen.getByTestId('change'));

    expect(screen.getByTestId('same-key-prop')).toHaveTextContent('new');
  });

  test('respects include/exclude cache matching', async () => {
    const user = userEvent.setup();

    function Host() {
      const [tab, setTab] = React.useState<'A' | 'B'>('A');

      return (
        <>
          <button data-testid="switch" onClick={() => setTab((t) => (t === 'A' ? 'B' : 'A'))}>
            switch
          </button>
          <KeepAlive include={['A']}>
            <Counter key={tab} label={tab} />
          </KeepAlive>
        </>
      );
    }

    render(<Host />);

    await user.click(screen.getByTestId('inc-A'));
    expect(screen.getByTestId('count-A')).toHaveTextContent('1');

    await user.click(screen.getByTestId('switch'));
    expect(screen.getByTestId('count-B')).toHaveTextContent('0');
    await user.click(screen.getByTestId('inc-B'));
    expect(screen.getByTestId('count-B')).toHaveTextContent('1');

    await user.click(screen.getByTestId('switch'));
    expect(screen.getByTestId('count-A')).toHaveTextContent('1');

    await user.click(screen.getByTestId('switch'));
    expect(screen.getByTestId('count-B')).toHaveTextContent('0');
  });

  test('evicts by LRU when max is reached', async () => {
    const user = userEvent.setup();

    function Host() {
      const [tab, setTab] = React.useState<'A' | 'B' | 'C'>('A');

      return (
        <>
          <button data-testid="to-a" onClick={() => setTab('A')}>
            A
          </button>
          <button data-testid="to-b" onClick={() => setTab('B')}>
            B
          </button>
          <button data-testid="to-c" onClick={() => setTab('C')}>
            C
          </button>
          <KeepAlive max={2}>
            <Counter key={tab} label={tab} />
          </KeepAlive>
        </>
      );
    }

    render(<Host />);

    await user.click(screen.getByTestId('inc-A'));
    await user.click(screen.getByTestId('to-b'));
    await user.click(screen.getByTestId('inc-B'));

    // Access A again so B becomes LRU.
    await user.click(screen.getByTestId('to-a'));
    expect(screen.getByTestId('count-A')).toHaveTextContent('1');

    // Introduce C; B should be evicted.
    await user.click(screen.getByTestId('to-c'));
    expect(screen.getByTestId('count-C')).toHaveTextContent('0');

    await user.click(screen.getByTestId('to-b'));
    expect(screen.getByTestId('count-B')).toHaveTextContent('0');
  });

  test('useActived/useDeactivated hooks fire on activation changes', async () => {
    const user = userEvent.setup();
    const events: string[] = [];

    function Life({ id }: { id: string }) {
      useActived(() => {
        events.push(`actived-${id}`);
      });
      useDeactivated(() => {
        events.push(`deactived-${id}`);
      });

      return <div data-testid={`life-${id}`}>{id}</div>;
    }

    function Host() {
      const [tab, setTab] = React.useState<'A' | 'B'>('A');

      return (
        <>
          <button data-testid="to-a" onClick={() => setTab('A')}>
            A
          </button>
          <button data-testid="to-b" onClick={() => setTab('B')}>
            B
          </button>
          <KeepAlive>
            <Life key={tab} id={tab} />
          </KeepAlive>
        </>
      );
    }

    render(<Host />);

    await act(async () => {
      await Promise.resolve();
    });

    await user.click(screen.getByTestId('to-b'));
    await act(async () => {
      await Promise.resolve();
    });

    await user.click(screen.getByTestId('to-a'));
    await act(async () => {
      await Promise.resolve();
    });

    expect(events).toContain('actived-A');
    expect(events).toContain('deactived-A');
    expect(events).toContain('actived-B');
  });
});
