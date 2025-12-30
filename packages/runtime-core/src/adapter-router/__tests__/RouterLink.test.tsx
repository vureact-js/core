import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { createMemoryHistory, createRouter, RouterLink } from '../';

describe('<RouterLink> test suites', () => {
  function TestWrapper({ children }: { initialEntries?: string[]; children: React.ReactNode }) {
    const { router } = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/about',
          name: 'about',
          component: <div>About Page {children}</div>,
        },
        {
          path: '/search',
          component: <div>Search Page {children}</div>,
        },
        {
          path: '/docs',
          component: <div>Docs Page {children}</div>,
        },
        {
          path: '/user/:id/:pw/:na',
          component: <div>User Page {children}</div>,
        },
      ],
      initialEntries: ['/about'],
    });

    return <RouterProvider router={router} />;
  }

  it('should render basic link in the document', () => {
    render(
      <TestWrapper>
        <RouterLink to="/about">About</RouterLink>
      </TestWrapper>,
    );

    const link = screen.getByText('About');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/about');
  });

  it('should render link with object "to" containing path', () => {
    render(
      <TestWrapper>
        <RouterLink to={{ path: '/about' }}>About</RouterLink>
      </TestWrapper>,
    );

    expect(screen.getByText('About')).toHaveAttribute('href', '/about');
  });

  it('should render link with object "to" containing path by name', () => {
    render(
      <TestWrapper>
        <RouterLink to={{ name: 'about' }}>About</RouterLink>
      </TestWrapper>,
    );

    expect(screen.getByText('About')).toHaveAttribute('href', '/about');
  });

  it('should render link with object "to" containing query parameters', () => {
    render(
      <TestWrapper>
        <RouterLink
          to={{
            path: '/search',
            query: { q: 'test', page: '1' },
          }}
        >
          Search
        </RouterLink>
      </TestWrapper>,
    );

    expect(screen.getByText('Search')).toHaveAttribute('href', '/search?q=test&page=1');
  });

  it('should render link with object "to" containing hash', () => {
    render(
      <TestWrapper>
        <RouterLink
          to={{
            path: '/docs',
            hash: 'section',
          }}
        >
          Docs
        </RouterLink>
      </TestWrapper>,
    );

    expect(screen.getByText('Docs')).toHaveAttribute('href', '/docs#section');
  });

  it('should support replace prop', () => {
    render(
      <TestWrapper>
        <RouterLink to="/about" replace>
          About
        </RouterLink>
      </TestWrapper>,
    );

    expect(screen.getByText('About')).toHaveAttribute('href', '/about');
  });

  it('should handle params in correct order', () => {
    render(
      <TestWrapper>
        <RouterLink
          to={{
            path: '/user',
            params: { na: 'john', id: '123', pw: 'secret' },
          }}
        >
          User Link
        </RouterLink>
      </TestWrapper>,
    );

    const link = screen.getByText('User Link');
    expect(link).toHaveAttribute('href', '/user');
  });

  it('should add active class when route matches', () => {
    render(
      <TestWrapper>
        <>
          <RouterLink
            to={{ path: '/about' }}
            inActiveClassName="inactive"
            activeClassName="active"
            exactActiveClassName="exact-active"
          >
            About
          </RouterLink>
          <RouterLink
            to={{ path: '/home' }}
            inActiveClassName="inactive"
            activeClassName="active"
            data-testid="homeLink"
          >
            Home
          </RouterLink>
        </>
      </TestWrapper>,
    );

    const link = screen.getByText('About');
    expect(link.classList).toContain('active');
    expect(link.classList).toContain('exact-active');
    expect(link.classList).not.toContain('inactive');

    const homeLink = screen.queryByTestId('homeLink');
    expect(homeLink?.classList).toContain('inactive');
    expect(homeLink?.classList).not.toContain('active');
  });

  it('should navigate to new route on click', async () => {
    const { router } = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: (
            <>
              <RouterLink to="/about">Go to About</RouterLink>
              <div>Current: /</div>
            </>
          ),
        },
        {
          path: '/about',
          component: <div>About Page</div>,
        },
      ],
      initialEntries: ['/'],
    });

    render(<RouterProvider router={router} />);

    const link = screen.getByText('Go to About');
    fireEvent.click(link);

    // 等待导航完成并验证新页面
    expect(await screen.findByText('About Page')).toBeInTheDocument();
  });

  it('should support customRender prop for custom rendering', () => {
    let capturedHref = '';
    let capturedIsActive = false;

    render(
      <TestWrapper>
        <RouterLink
          to="/about"
          customRender={({ href, isActive, navigate }) => {
            capturedHref = href;
            capturedIsActive = isActive;
            return (
              <button onClick={navigate} data-active={isActive}>
                Custom Button
              </button>
            );
          }}
        />
      </TestWrapper>,
    );

    screen.getByText('Custom Button');

    expect(capturedHref).toBe('/about');
    expect(capturedIsActive).toBe(true);
  });

  it('should handle complex object "to" prop in customRender mode and navigate correctly', async () => {
    const { router } = createRouter({
      routes: [
        {
          path: '/',
          component: (
            <RouterLink
              to={{
                path: '/search',
                query: { q: 'test', page: '1' },
                hash: 'results',
              }}
              customRender={({ href, navigate }) => (
                <button onClick={navigate}>Navigate to Search</button>
              )}
            />
          ),
        },
        {
          path: '/search',
          component: <div>Search Page Content</div>,
        },
      ],
      initialEntries: ['/'],
    });

    render(<RouterProvider router={router} />);

    const button = screen.getByText('Navigate to Search');
    // 初始在首页
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(await screen.findByText('Search Page Content')).toBeInTheDocument();
  });

  it('should work with both children and customRender', () => {
    render(
      <TestWrapper>
        <RouterLink
          to="/about"
          customRender={({ navigate }) => <button onClick={navigate}>Custom Render</button>}
        >
          This children should be ignored
        </RouterLink>
      </TestWrapper>,
    );

    const button = screen.getByText('Custom Render');
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('This children should be ignored')).not.toBeInTheDocument();
  });
});
