import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { createMemoryHistory, createRouter, type RouteLocation, useRoute } from '../';

describe('useRoute test suites', () => {
  let routeData: RouteLocation | null = null;

  function TestComponent() {
    const route = useRoute();

    useEffect(() => {
      routeData = route;
    }, [route]);

    return <></>;
  }

  beforeEach(() => {
    routeData = null;
  });

  it('should return correct route information', () => {
    const { router } = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/user/:id',
          name: 'user',
          component: <TestComponent />,
        },
      ],
      initialEntries: ['/user/123?name=test#section'],
    });

    render(<RouterProvider router={router} />);

    expect(routeData).not.toBeNull();
    expect(routeData!.path).toBe('/user/123');
    expect(routeData!.name).toBe('user');
    expect(routeData!.params).toEqual({ id: '123' });
    expect(routeData!.query).toEqual({ name: 'test' });
    expect(routeData!.hash).toBe('#section');
    expect(routeData!.fullPath).toBe('/user/123?name=test#section');
  });

  it('Redirection should return correct information.', () => {
    const { router } = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          // redirect: '/post/123',

          // redirect: {
          //   path: '/post/:id',
          //   params: { id: '123' },
          //   query: { name: 'test' },
          //   state: { pwd: '123' },
          // },

          redirect: (to) => {
            // return '/post/123';
            return {
              path: '/post/:id',
              params: { id: '123' },
              query: { name: 'test' },
              state: { pwd: '123' },
            };
          },
        },
        {
          path: '/post/:id',
          component: <TestComponent />,
        },
      ],
    });

    render(<RouterProvider router={router} />);

    expect(routeData!.path).toBe('/post/123');
    expect(routeData!.params).toStrictEqual({ id: '123' });
    expect(routeData!.query).toStrictEqual({ name: 'test' });
    expect(routeData!.state).toStrictEqual({ pwd: '123' });
    expect(routeData!.fullPath).toBe('/post/123?name=test');
  });
});
