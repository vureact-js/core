import '@testing-library/jest-dom';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { RouterView, createRouter, createWebHistory } from '../';

const TestApp = () => (
  <div data-testid="layout">
    <header>Header</header>
    <main>
      <RouterView />
    </main>
  </div>
);

const Users = () => <div data-testid="Users">Users Page</div>;
const Contact = () => <div data-testid="Contact">Contact Page</div>;
const Login = () => <div data-testid="Login">Login Page</div>;
const Home = () => <div data-testid="Home">Home Page</div>;
const Profile = () => <div data-testid="Profile">Profile Page</div>;
const UserList = () => <div data-testid="UserList">List Page</div>;
const Details = () => <div data-testid="Details">Details Page</div>;

describe('Exclusive Guards Test Suites', () => {
  describe('Basic Routes', () => {
    let role = '';

    function removeQueryParams(to: any) {
      if (Object.keys(to.query).length) return { path: to.path, query: {}, hash: to.hash };
    }

    function removeHash(to: any) {
      if (to.hash) return { path: to.path, query: to.query, hash: '' };
    }

    const createTestRouteOptions = () => ({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: <TestApp />,
          children: [
            {
              path: 'users/:id',
              component: <Users />,
              beforeEnter: [removeQueryParams, removeHash],
            },
            {
              path: 'contact',
              component: <Contact />,
              beforeEnter(to: object, from: object) {
                if (role === 'user') {
                  return true;
                }
                return { name: 'Login' };
              },
            },
            { path: 'login', name: 'Login', component: <Login /> },
          ],
        },
      ],
    });

    beforeEach(() => {
      jest.clearAllMocks();
      role = '';
    });

    afterEach(() => {
      cleanup();
      window.history.pushState({}, '', '/');
    });

    it('should execute beforeEnter guard array and remove query params and hash', async () => {
      const { RouterProvider, router } = createRouter(createTestRouteOptions());

      render(<RouterProvider />);

      // 初始在根路径，导航到带query和hash的用户页面
      await act(async () => {
        router.navigate('/users/123?tab=profile#section');
      });

      // 等待导航完成，验证 beforeEnter 清除了 query 和 hash
      await waitFor(() => {
        expect(screen.getByTestId('Users')).toBeInTheDocument();
      });

      // 验证当前路径应该是 /users/123（没有query和hash）
      expect(router.state.location.pathname).toBe('/users/123');
      expect(router.state.location.search).toBe('');
      expect(router.state.location.hash).toBe('');
    });

    it('should redirect to login when accessing contact without user role', async () => {
      const { RouterProvider, router } = createRouter(createTestRouteOptions());

      render(<RouterProvider />);

      // 当前在 /users/123，尝试访问 contact（没有user角色）
      await act(async () => {
        router.navigate('/contact');
      });

      // 应该被重定向到登录页
      await waitFor(() => {
        expect(screen.getByTestId('Login')).toBeInTheDocument();
      });
    });

    it('should allow access to contact when user has user role', async () => {
      const { RouterProvider, router } = createRouter(createTestRouteOptions());

      render(<RouterProvider />);

      // 设置用户角色
      role = 'user';

      // 当前在 /login，尝试访问 contact（有user角色）
      await act(async () => {
        router.navigate('/contact');
      });

      // 应该能够正常访问
      await waitFor(() => {
        expect(screen.getByTestId('Contact')).toBeInTheDocument();
      });
    });

    it('should not trigger beforeEnter when only params change', async () => {
      const mockBeforeEnter = jest.fn((to, from, next) => next());

      const { RouterProvider, router } = createRouter({
        history: createWebHistory(),
        routes: [
          {
            path: '/',
            component: <TestApp />,
            children: [
              { path: 'home', component: <Home /> },
              {
                path: 'users/:id',
                component: <Users />,
                beforeEnter: mockBeforeEnter,
              },
            ],
          },
        ],
      });

      render(<RouterProvider />);

      // 首次导航到 /users/1，应该触发 beforeEnter
      await act(async () => {
        router.navigate('/users/1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Users')).toBeInTheDocument();
      });

      expect(mockBeforeEnter).toHaveBeenCalledTimes(1);

      // 重置调用计数
      mockBeforeEnter.mockClear();

      // 导航到 /users/2（仅参数变化），不应该触发 beforeEnter
      await act(async () => {
        router.navigate('/users/2');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Users')).toBeInTheDocument();
      });

      expect(mockBeforeEnter).not.toHaveBeenCalled();
    });

    it('should not trigger beforeEnter when only query or hash changes', async () => {
      const mockBeforeEnter = jest.fn((to, from, next) => next());

      const { RouterProvider, router } = createRouter({
        history: createWebHistory(),
        routes: [
          {
            path: '/',
            redirect: '/home',
            component: <TestApp />,
            children: [
              { path: 'home', component: <Home /> },
              {
                path: 'profile',
                component: <Profile />,
                beforeEnter: mockBeforeEnter,
              },
            ],
          },
        ],
      });

      render(<RouterProvider />);

      await waitFor(() => {
        expect(screen.getByTestId('Home')).toBeInTheDocument();
      });

      // 首次导航到 /profile，应该触发 beforeEnter
      await act(async () => {
        router.navigate('/profile');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Profile')).toBeInTheDocument();
      });

      expect(mockBeforeEnter).toHaveBeenCalledTimes(1);

      // 重置调用计数
      mockBeforeEnter.mockClear();

      // 添加 query 参数，不应该触发 beforeEnter（路径相同）
      await act(async () => {
        router.navigate('/profile?tab=settings');
      });

      expect(mockBeforeEnter).not.toHaveBeenCalled();

      // 添加 hash，不应该触发 beforeEnter（路径相同）
      await act(async () => {
        router.navigate('/profile#section');
      });

      expect(mockBeforeEnter).not.toHaveBeenCalled();
    });

    it('should execute beforeEnter in correct order with global guards', async () => {
      const executionOrder: string[] = [];

      const { RouterProvider, router, beforeEach, beforeResolve, afterEach } = createRouter({
        history: createWebHistory(),
        routes: [
          {
            path: '/',
            component: <TestApp />,
            children: [
              {
                path: 'protected',
                component: <Profile />,
                beforeEnter: (to, from) => {
                  executionOrder.push('beforeEnter');
                },
              },
            ],
          },
        ],
      });

      beforeEach((to, from, next) => {
        executionOrder.push('beforeEach');
        next();
      });

      beforeResolve((to, from, next) => {
        executionOrder.push('beforeResolve');
        next();
      });

      afterEach(() => {
        executionOrder.push('afterEach');
      });

      render(<RouterProvider />);

      // 从初始路径导航到受保护的路由
      await act(async () => {
        router.navigate('/protected');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Profile')).toBeInTheDocument();
      });

      // 验证执行顺序
      expect(executionOrder).toEqual(['beforeEach', 'beforeEnter', 'beforeResolve', 'afterEach']);
    });
  });

  describe('Nested Routes', () => {
    const mockParentBeforeEnter = jest.fn((to, from, next) => next());
    const mockChildBeforeEnter = jest.fn((to, from, next) => next());

    let router: any;
    let RouterProvider: any;

    beforeEach(() => {
      jest.clearAllMocks();

      const routerInstance = createRouter({
        history: createWebHistory(),
        routes: [
          {
            path: '/',
            component: <TestApp />,
            children: [
              {
                path: 'user',
                component: <RouterView />,
                beforeEnter: mockParentBeforeEnter,
                children: [
                  { path: 'list', component: <UserList />, beforeEnter: mockChildBeforeEnter },
                  { path: 'details', component: <Details /> },
                ],
              },
            ],
          },
        ],
      });

      router = routerInstance.router;
      RouterProvider = routerInstance.RouterProvider;
    });

    afterEach(() => {
      cleanup();
      window.history.pushState({}, '', '/');
    });

    it('should not trigger parent beforeEnter when moving between child routes with same parent', async () => {
      render(<RouterProvider />);

      // 首次导航到 /user/list，应该触发父级 beforeEnter + 自身 beforeEnter
      await act(async () => {
        router.navigate('/user/list');
      });

      await waitFor(() => {
        // 通过 testid 找到 user-layout，然后在其内部查找子路由内容
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockParentBeforeEnter).toHaveBeenCalledTimes(1);
      expect(mockChildBeforeEnter).toHaveBeenCalledTimes(1);

      // 重置调用计数;
      mockParentBeforeEnter.mockClear();
      mockChildBeforeEnter.mockClear();

      await act(async () => {
        router.navigate('/user/details');
      });

      // 导航到 /user/details（相同父级的子路由），不应该触发父级 beforeEnter
      await waitFor(() => {
        expect(screen.getByTestId('Details')).toBeInTheDocument();
      });

      expect(mockParentBeforeEnter).not.toHaveBeenCalled();
      expect(mockChildBeforeEnter).not.toHaveBeenCalled();
    });

    it('should trigger child beforeEnter when moving between child routes with same parent', async () => {
      render(<RouterProvider />);

      // 导航到 /user/details 作为起点
      await act(async () => {
        router.navigate('/user/details');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Details')).toBeInTheDocument();
      });

      // 导航到 /user/list（有 beforeEnter 的子路由），应该触发子路由的 beforeEnter
      await act(async () => {
        router.navigate('/user/list');
      });

      await waitFor(() => {
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockChildBeforeEnter).toHaveBeenCalledTimes(1);
    });

    it('should trigger parent beforeEnter when entering from different parent route', async () => {
      render(<RouterProvider />);

      // 从 / 导航到 /user/list，应该触发父级 beforeEnter
      await act(async () => {
        router.navigate('/user/details');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Details')).toBeInTheDocument();
      });

      expect(mockParentBeforeEnter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complex Nested Routes', () => {
    const mockGrandParentBeforeEnter = jest.fn((to, from, next) => next());
    const mockParentBeforeEnter = jest.fn((to, from, next) => next());
    const mockChildBeforeEnter = jest.fn((to, from, next) => next());

    const mockUserBeforeEnter = jest.fn((to, from, next) => next());
    const mockProfileBeforeEnter = jest.fn((to, from, next) => next());

    const mockAdminBeforeEnter = jest.fn((to, from, next) => next());

    let router: any;
    let RouterProvider: any;

    beforeEach(() => {
      jest.clearAllMocks();

      const routerInstance = createRouter({
        history: createWebHistory(),
        routes: [
          {
            path: '/',
            component: <TestApp />,
            children: [
              {
                path: 'grand',
                component: <RouterView />,
                beforeEnter: mockGrandParentBeforeEnter,
                children: [
                  {
                    path: 'parent',
                    component: <RouterView />,
                    beforeEnter: mockParentBeforeEnter,
                    children: [
                      {
                        path: 'child',
                        component: <UserList />,
                        beforeEnter: mockChildBeforeEnter,
                      },
                      {
                        path: 'nephew',
                        component: <Details />,
                      },
                    ],
                  },
                ],
              },
              {
                path: 'users/:userId',
                component: <RouterView />,
                beforeEnter: mockUserBeforeEnter,
                children: [
                  {
                    path: 'profile',
                    component: <UserList />,
                    beforeEnter: mockProfileBeforeEnter,
                  },
                  {
                    path: 'settings',
                    component: <Details />,
                  },
                ],
              },
              {
                path: 'admin',
                component: <RouterView />,
                beforeEnter: mockAdminBeforeEnter,
                children: [
                  {
                    path: 'users/:userId',
                    component: <RouterView />,
                    beforeEnter: mockUserBeforeEnter,
                    children: [
                      { path: 'edit', component: <UserList /> },
                      { path: 'view', component: <Details /> },
                    ],
                  },
                ],
              },
              {
                path: 'home',
                component: <RouterView />,
                beforeEnter: mockParentBeforeEnter,
                redirect: '/home/main',
                children: [
                  {
                    path: 'main',
                    component: <Home />,
                    beforeEnter: mockChildBeforeEnter,
                  },
                  {
                    path: 'contact',
                    component: <Contact />,
                  },
                ],
              },
            ],
          },
        ],
      });

      router = routerInstance.router;
      RouterProvider = routerInstance.RouterProvider;
    });

    afterEach(() => {
      cleanup();
      window.history.pushState({}, '', '/');
    });

    it('should handle multi-level nested routes with different depths', async () => {
      render(<RouterProvider />);

      // 首次导航到 /grand/parent/child，应该触发所有父级 beforeEnter
      await act(async () => {
        router.navigate('/grand/parent/child');
      });

      await waitFor(() => {
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockGrandParentBeforeEnter).toHaveBeenCalledTimes(1);
      expect(mockParentBeforeEnter).toHaveBeenCalledTimes(1);
      expect(mockChildBeforeEnter).toHaveBeenCalledTimes(1);

      mockGrandParentBeforeEnter.mockClear();
      mockParentBeforeEnter.mockClear();
      mockChildBeforeEnter.mockClear();

      // 导航到 /grand/parent/nephew
      await act(async () => {
        router.navigate('/grand/parent/nephew');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Details')).toBeInTheDocument();
      });

      // 父级 beforeEnter 不应该触发
      expect(mockGrandParentBeforeEnter).not.toHaveBeenCalled();
      expect(mockParentBeforeEnter).not.toHaveBeenCalled();
      expect(mockChildBeforeEnter).not.toHaveBeenCalled(); // child 的 beforeEnter 不应该触发，因为导航目标不是 child
    });

    it('should handle dynamic nested routes correctly', async () => {
      render(<RouterProvider />);

      // 首次导航到 /users/123/profile
      await act(async () => {
        router.navigate('/users/123/profile');
      });

      await waitFor(() => {
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockUserBeforeEnter).toHaveBeenCalledTimes(1);
      expect(mockProfileBeforeEnter).toHaveBeenCalledTimes(1);

      // 重置调用计数
      mockUserBeforeEnter.mockClear();
      mockProfileBeforeEnter.mockClear();

      // 导航到 /users/123/settings（相同父级的子路由），不应该触发父级 beforeEnter
      await act(async () => {
        router.navigate('/users/123/settings');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Details')).toBeInTheDocument();
      });

      expect(mockUserBeforeEnter).not.toHaveBeenCalled();
      expect(mockProfileBeforeEnter).not.toHaveBeenCalled();

      // 重置调用计数
      mockUserBeforeEnter.mockClear();
      mockProfileBeforeEnter.mockClear();

      // 导航到 /users/456/profile（不同用户，应该触发父级 beforeEnter）
      await act(async () => {
        router.navigate('/users/456/profile');
      });

      await waitFor(() => {
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockUserBeforeEnter).toHaveBeenCalledTimes(1);
      expect(mockProfileBeforeEnter).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed static and dynamic nested routes', async () => {
      render(<RouterProvider />);

      // 首次导航到 /admin/users/123/edit
      await act(async () => {
        router.navigate('/admin/users/123/edit');
      });

      await waitFor(() => {
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockAdminBeforeEnter).toHaveBeenCalledTimes(1);
      expect(mockUserBeforeEnter).toHaveBeenCalledTimes(1);

      // 重置调用计数
      mockAdminBeforeEnter.mockClear();
      mockUserBeforeEnter.mockClear();

      // 导航到 /admin/users/123/view（相同父级的子路由），不应该触发父级 beforeEnter
      await act(async () => {
        router.navigate('/admin/users/123/view');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Details')).toBeInTheDocument();
      });

      expect(mockAdminBeforeEnter).not.toHaveBeenCalled();
      expect(mockUserBeforeEnter).not.toHaveBeenCalled();

      // 重置调用计数
      mockAdminBeforeEnter.mockClear();
      mockUserBeforeEnter.mockClear();

      // 导航到 /admin/users/456/edit（不同用户，应该触发用户级 beforeEnter）
      await act(async () => {
        router.navigate('/admin/users/456/edit');
      });

      await waitFor(() => {
        expect(screen.getByTestId('UserList')).toBeInTheDocument();
      });

      expect(mockAdminBeforeEnter).not.toHaveBeenCalled(); // admin 级不变
      expect(mockUserBeforeEnter).toHaveBeenCalledTimes(1); // 用户级变化
    });

    it('should handle route with index routes in nested structure', async () => {
      render(<RouterProvider />);

      // 首次导航到 /home（index路由）
      await act(async () => {
        router.navigate('/home');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Home')).toBeInTheDocument();
      });

      // 在 redirect 路由 /home 中， beforeEnter 不应该被触发
      expect(mockParentBeforeEnter).not.toHaveBeenCalled();
      // 跳转到 /home/main 应该触发自身 beforeEnter
      expect(mockChildBeforeEnter).toHaveBeenCalledTimes(1);

      // 重置调用计数
      mockChildBeforeEnter.mockClear();

      // 导航到 /home/contact，不应该触发父级 beforeEnter
      await act(async () => {
        router.navigate('/home/contact');
      });

      await waitFor(() => {
        expect(screen.getByTestId('Contact')).toBeInTheDocument();
      });

      expect(mockParentBeforeEnter).not.toHaveBeenCalled();
      expect(mockChildBeforeEnter).not.toHaveBeenCalled();
    });
  });
});
