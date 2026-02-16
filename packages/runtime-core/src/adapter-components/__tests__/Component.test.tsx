import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Component } from '../Component';

describe('Component', () => {
  test('renders native tag target', () => {
    render(
      <Component is="section" data-testid="native">
        hello
      </Component>,
    );

    expect(screen.getByTestId('native')).toHaveTextContent('hello');
    expect(screen.getByTestId('native').tagName).toBe('SECTION');
  });

  test('renders component type target and forwards props', () => {
    const Target = ({ label }: { label: string }) => <div data-testid="target">{label}</div>;

    render(<Component is={Target} label="from-props" />);

    expect(screen.getByTestId('target')).toHaveTextContent('from-props');
  });

  test('clones react element target and merges props/children', () => {
    const base = <button type="button">old</button>;

    render(
      <Component is={base} data-testid="btn" className="next">
        new
      </Component>,
    );

    const button = screen.getByTestId('btn');
    expect(button).toHaveTextContent('new');
    expect(button).toHaveClass('next');
  });

  test('returns null and logs error for invalid is', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<Component is={null as any} />);

    expect(container).toBeEmptyDOMElement();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("[Component error] Invalid 'is'"));

    spy.mockRestore();
  });
});
