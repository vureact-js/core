import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { RouterView, createRouter, createWebHistory } from '../';

const createTestRouteOptions = () => ({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: <TestApp />,
      children: [
        { path: 'home', component: <Home /> },
        { path: 'about', component: <About /> },
        { path: 'contact', component: <Contact />, meta: { requiresCamera: true } },
        {
          path: 'profile/:id',
          component: <Profile />,
          meta: { requiresAuth: true },
        },
        { path: 'dashboard', component: <Dashboard />, meta: { requiresAuth: true } },
        { path: 'login', name: 'login', component: <Login /> },
      ],
    },
  ],
});

const TestApp = () => (
  <div data-testid="layout">
    <header>Header</header>
    <main>
      <RouterView />
    </main>
  </div>
);

const Home = () => <div>Home Page</div>;
const About = () => <div>About Page</div>;
const Contact = () => <div>Contact Page</div>;
const Profile = () => <div>Profile Page</div>;
const Dashboard = () => <div>Dashboard Page</div>;
const Login = () => <div>Login Page</div>;

// ============== 基础测试 ===============

describe('Global Navigation Guards Basic Test Suites', () => {
  // 每个测试前清理所有状态
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('beforeEach Guard', () => {
    it('should execute beforeEach on every navigation', async () => {
      const mockGuard = jest.fn((to, from, next) => next());
      const { RouterProvider, router, beforeEach } = createRouter(createTestRouteOptions());

      beforeEach(mockGuard);
      render(<RouterProvider />);

      // 导航到多个路由
      const navigations = ['/home', '/about', '/contact'];
      for (const path of navigations) {
        await act(async () => {
          router.navigate(path);
        });
      }

      expect(mockGuard).toHaveBeenCalledTimes(3);
    });

    it('should pass correct route objects to guards', async () => {
      const mockGuard = jest.fn((to, from, next) => next());
      const { RouterProvider, router, beforeEach } = createRouter(createTestRouteOptions());

      beforeEach(mockGuard);
      render(<RouterProvider />);

      await act(async () => {
        router.navigate('/profile/123?tab=info#section');
      });

      expect(mockGuard).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/profile/123',
          params: { id: '123' },
          query: { tab: 'info' },
          hash: '#section',
          meta: { requiresAuth: true },
        }),
        expect.objectContaining({ path: '/contact' }), // 这里为 '/contact' 是因为上一个测试最后进入的页面
        expect.any(Function),
      );
    });
  });

  describe('afterEach Guard', () => {
    it('should execute afterEach after successful navigation', async () => {
      const mockAfterGuard = jest.fn();
      const { RouterProvider, router, afterEach } = createRouter(createTestRouteOptions());

      afterEach(mockAfterGuard);
      render(<RouterProvider />);

      await act(async () => {
        router.navigate('/home');
      });

      await waitFor(() => {
        expect(mockAfterGuard).toHaveBeenCalledWith(
          expect.objectContaining({ path: '/home' }),
          expect.objectContaining({ path: '/profile/123' }),
        );
      });
    });

    it('should not execute afterEach when navigation is blocked', async () => {
      const mockAfterGuard = jest.fn();
      const mockBeforeGuard = jest.fn((to, from, next) => next(false));

      const { RouterProvider, router, beforeEach, afterEach } =
        createRouter(createTestRouteOptions());

      beforeEach(mockBeforeGuard);
      afterEach(mockAfterGuard);
      render(<RouterProvider />);

      await act(async () => {
        router.navigate('/home');
      });

      expect(mockAfterGuard).not.toHaveBeenCalled();
    });
  });
});

// ================ 导航路由守卫控制测试 ==================

describe('Global Navigation Guards Control Test Suites', () => {
  describe('beforeEach Guard', () => {
    // 每个测试前等待初始导航完成
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it('should intercept route navigation and redirect pages.', async () => {
      const mockGuard = jest.fn((to, from, next) => next());
      const { RouterProvider, router, beforeEach } = createRouter(createTestRouteOptions());

      // 初始导航
      beforeEach(mockGuard);
      render(<RouterProvider />);

      // 等待初始导航完成
      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      // 拦截 dashboard 跳转至 login
      beforeEach((to, from, next) => {
        if (to.path === '/dashboard') {
          next({ name: 'login' });
        } else {
          next();
        }
      });

      await act(async () => {
        router.navigate('/dashboard');
      });

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      // 尝试访问 profile 需要认证的页面
      let userRole = 'user';
      beforeEach((to, from, next) => {
        if (to.meta?.requiresAuth && userRole !== 'admin') {
          next('/login');
        } else {
          next();
        }
      });

      await act(async () => {
        router.navigate('/profile/123');
      });

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });

      // 提升权限后再次尝试
      userRole = 'admin';
      await act(async () => {
        router.navigate('/profile/123');
      });

      await waitFor(() => {
        expect(screen.getByText('Profile Page')).toBeInTheDocument();
      });

      // 守卫并发执行
      const guardExecutionOrder: string[] = [];

      beforeEach((to, from, next) => {
        guardExecutionOrder.push('first');
        next();
      });

      beforeEach((to, from, next) => {
        guardExecutionOrder.push('second');
        next();
      });

      beforeEach((to, from, next) => {
        guardExecutionOrder.push('third');
        next();
      });

      await act(async () => {
        router.navigate('/about');
      });

      await waitFor(() => {
        expect(screen.getByText('About Page')).toBeInTheDocument();
      });

      expect(guardExecutionOrder).toEqual(['first', 'second', 'third']);
    });
  });

  describe('afterEach Guard', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it('should execute afterEach hooks in order after successful navigation', async () => {
      const { RouterProvider, router, afterEach } = createRouter(createTestRouteOptions());

      const executionOrder: string[] = [];

      // 注册多个 afterEach 守卫
      afterEach(() => {
        executionOrder.push('first');
      });

      afterEach(() => {
        executionOrder.push('second');
      });

      afterEach(() => {
        executionOrder.push('third');
      });

      render(<RouterProvider />);

      // 上一个测试最后进入的页面
      expect(screen.getByText('About Page')).toBeInTheDocument();

      // 执行导航
      await act(async () => {
        router.navigate('/contact');
      });

      // 验证 afterEach 守卫按顺序执行
      await waitFor(() => {
        expect(executionOrder).toEqual(['first', 'second', 'third']);
        expect(screen.getByText('Contact Page')).toBeInTheDocument();
      });
    });

    it('should receive correct route objects in afterEach guards', async () => {
      const { RouterProvider, router, afterEach } = createRouter(createTestRouteOptions());

      const mockAfterGuard = jest.fn();

      afterEach(mockAfterGuard);
      render(<RouterProvider />);

      // 上一个测试最后进入的页面
      expect(screen.getByText('Contact Page')).toBeInTheDocument();

      // 导航到带参数的路由
      await act(async () => {
        router.navigate('/profile/456?view=details#main');
      });

      // 验证 afterEach 接收到正确的路由对象
      await waitFor(() => {
        expect(mockAfterGuard).toHaveBeenCalledWith(
          expect.objectContaining({
            path: '/profile/456',
            params: { id: '456' },
            query: { view: 'details' },
            hash: '#main',
            meta: { requiresAuth: true },
          }),
          expect.objectContaining({ path: '/contact' }),
          // afterEach 没有 next 参数
        );
      });
    });

    it('should not execute afterEach when navigation is blocked by beforeEach', async () => {
      const { RouterProvider, router, beforeEach, afterEach } =
        createRouter(createTestRouteOptions());

      const mockAfterGuard = jest.fn();
      const mockBeforeGuard = jest.fn((to, from, next) => {
        if (to.path === '/dashboard') {
          next(false); // 阻止导航
        } else {
          next();
        }
      });

      beforeEach(mockBeforeGuard);
      afterEach(mockAfterGuard);

      render(<RouterProvider />);

      // 上一个测试最后进入的页面
      expect(screen.getByText('Profile Page')).toBeInTheDocument();

      // 尝试导航到被阻止的路由
      await act(async () => {
        router.navigate('/dashboard');
      });

      // 验证 afterEach 没有被调用
      await waitFor(() => {
        expect(mockAfterGuard).not.toHaveBeenCalled();
        // 页面应该仍然显示 Profile Page，因为导航被阻止
        expect(screen.getByText('Profile Page')).toBeInTheDocument();
      });
    });

    it('should execute afterEach even when beforeEach redirects', async () => {
      const { RouterProvider, router, beforeEach, afterEach } =
        createRouter(createTestRouteOptions());

      const mockAfterGuard = jest.fn();

      afterEach(mockAfterGuard);

      // 设置重定向守卫
      beforeEach((to, from, next) => {
        if (to.meta?.requiresAuth) {
          next('/login'); // 重定向到登录页
        } else {
          next();
        }
      });

      render(<RouterProvider />);

      // 上一个测试最后进入的页面
      expect(screen.getByText('Profile Page')).toBeInTheDocument();

      // 导航到 dashboard，应该被重定向到 login
      await act(async () => {
        router.navigate('/dashboard');
      });

      // 验证 afterEach 仍然被执行（因为重定向也是成功的导航）
      await waitFor(() => {
        expect(mockAfterGuard).toHaveBeenCalled();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('beforResolve Guard', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it('should be called once when navigating.', async () => {
      const { router, RouterProvider, beforeResolve } = createRouter(createTestRouteOptions());

      const mockGuard = jest.fn((to, from, next) => next());

      beforeResolve(mockGuard);

      render(<RouterProvider />);

      // 上一个测试最后进入的页面
      expect(screen.getByText('Login Page')).toBeInTheDocument();

      await act(async () => {
        router.navigate('/home');
      });

      expect(mockGuard).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });
    });
  });
});
