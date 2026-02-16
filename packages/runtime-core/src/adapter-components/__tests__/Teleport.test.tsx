import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Teleport } from '../Teleport';

describe('Teleport', () => {
  test('renders into target container when to is valid', async () => {
    const target = document.createElement('div');
    target.id = 'tp-target';
    document.body.appendChild(target);

    render(
      <Teleport to="#tp-target">
        <span data-testid="teleported">hello</span>
      </Teleport>,
    );

    await waitFor(() => {
      expect(target.querySelector('[data-testid="teleported"]')).toBeInTheDocument();
    });
  });

  test('falls back to in-place rendering when target becomes invalid', async () => {
    const target = document.createElement('div');
    target.id = 'tp-dynamic';
    document.body.appendChild(target);

    const { rerender } = render(
      <Teleport to="#tp-dynamic">
        <span data-testid="dynamic-teleported">hello</span>
      </Teleport>,
    );

    await waitFor(() => {
      expect(target.querySelector('[data-testid="dynamic-teleported"]')).toBeInTheDocument();
    });

    rerender(
      <Teleport to="#missing-target">
        <span data-testid="dynamic-teleported">hello</span>
      </Teleport>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dynamic-teleported')).toBeInTheDocument();
    });
  });

  test('respects disabled toggle and renders in place when disabled', async () => {
    const target = document.createElement('div');
    target.id = 'tp-disabled';
    document.body.appendChild(target);

    const { rerender } = render(
      <Teleport to="#tp-disabled" disabled>
        <span data-testid="disabled-teleported">hello</span>
      </Teleport>,
    );

    expect(screen.getByTestId('disabled-teleported')).toBeInTheDocument();

    rerender(
      <Teleport to="#tp-disabled" disabled={false}>
        <span data-testid="disabled-teleported">hello</span>
      </Teleport>,
    );

    await waitFor(() => {
      expect(target.querySelector('[data-testid="disabled-teleported"]')).toBeInTheDocument();
    });
  });

  test('supports defer rendering', async () => {
    const target = document.createElement('div');
    target.id = 'tp-defer';
    document.body.appendChild(target);

    render(
      <Teleport to="#tp-defer" defer>
        <span data-testid="defer-teleported">hello</span>
      </Teleport>,
    );

    await waitFor(() => {
      expect(target.querySelector('[data-testid="defer-teleported"]')).toBeInTheDocument();
    });
  });

  test('logs error for invalid selector', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Teleport to="#not-exist">
        <span data-testid="invalid-target">hello</span>
      </Teleport>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('invalid-target')).toBeInTheDocument();
    });

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[Teleport error]'));
    spy.mockRestore();
  });
});
