import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { act, ReactNode } from 'react';
import { createRouter, createWebHistory, RouteLocation, RouterInstance, RouterView } from '../';

describe('RouterView Test Suites', () => {
  let routerInstance: RouterInstance;
  let customRenderCallCount = 0;
  let lastReceivedRoute: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    customRenderCallCount = 0;
    lastReceivedRoute = null;

    // 创建自定义渲染函数来捕获 route 参数
    const customRender = (component: ReactNode, route: RouteLocation) => {
      customRenderCallCount++;
      lastReceivedRoute = route;
      return component;
    };

    routerInstance = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: <RouterView customRender={customRender} />,
          children: [
            {
              path: '/home',
              component: <div data-testid="home-content">Home Page</div>,
              meta: { title: 'Home' },
            },
            {
              path: '/about',
              component: <div data-testid="about-content">About Page</div>,
              meta: { title: 'About' },
            },
            {
              path: '/deep/nested/route',
              component: <div data-testid="deep-content">Deep Page</div>,
              meta: { title: 'Deep' },
            },
          ],
        },
      ],
    });

    // 注册 afterEach 守卫来修改 meta.transition
    routerInstance.afterEach((to, from) => {
      const toDepth = to.path.split('/').filter(Boolean).length;
      const fromDepth = from.path.split('/').filter(Boolean).length;

      // 根据路径深度设置过渡动画类型
      to.meta.transition = toDepth < fromDepth ? 'slide-right' : 'slide-left';

      // 添加导航时间戳
      to.meta.navigatedAt = Date.now();
    });
  });

  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
    routerInstance.clearAll();
  });

  it('should pass the latest route with updated meta to customRender after beforeEach', async () => {
    render(<routerInstance.RouterProvider />);

    // 初始导航到 home
    await act(async () => {
      routerInstance.router.navigate('/home');
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-content')).toBeInTheDocument();
    });

    // 验证 customRender 被调用且收到了最新的 route
    expect(customRenderCallCount).toBeGreaterThan(0);
    expect(lastReceivedRoute).toBeDefined();
    expect(lastReceivedRoute.meta.transition).toBeDefined();
    expect(lastReceivedRoute.path).toBe('/home');
  });

  it('should update route meta.transition based on path depth changes', async () => {
    render(<routerInstance.RouterProvider />);

    // 从浅路径导航到深路径
    await act(async () => {
      routerInstance.router.navigate('/home');
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-content')).toBeInTheDocument();
    });

    const initialRoute = { ...lastReceivedRoute };

    // 导航到更深路径
    await act(async () => {
      routerInstance.router.navigate('/deep/nested/route');
    });

    await waitFor(() => {
      expect(screen.getByTestId('deep-content')).toBeInTheDocument();
    });

    // 验证 meta.transition 被正确更新
    expect(lastReceivedRoute.meta.transition).toBe('slide-left'); // 从浅到深
    expect(lastReceivedRoute.path).toBe('/deep/nested/route');
    expect(lastReceivedRoute.meta.navigatedAt).toBeGreaterThan(initialRoute.meta.navigatedAt || 0);
  });

  it('should set slide-right transition when navigating from deep to shallow path', async () => {
    render(<routerInstance.RouterProvider />);

    // 先导航到深路径
    await act(async () => {
      routerInstance.router.navigate('/deep/nested/route');
    });

    await waitFor(() => {
      expect(screen.getByTestId('deep-content')).toBeInTheDocument();
    });

    const deepRoute = { ...lastReceivedRoute };

    // 导航到浅路径
    await act(async () => {
      routerInstance.router.navigate('/about');
    });

    await waitFor(() => {
      expect(screen.getByTestId('about-content')).toBeInTheDocument();
    });

    // 验证 meta.transition 被设置为 slide-right（从深到浅）
    expect(lastReceivedRoute.meta.transition).toBe('slide-right');
    expect(lastReceivedRoute.path).toBe('/about');
    expect(lastReceivedRoute.meta.navigatedAt).toBeGreaterThan(deepRoute.meta.navigatedAt || 0);
  });

  it('should maintain the updated route meta across multiple navigations', async () => {
    render(<routerInstance.RouterProvider />);

    const transitions: string[] = [];

    // 多次导航并记录过渡类型
    await act(async () => {
      routerInstance.router.navigate('/home');
    });
    await waitFor(() => {
      expect(screen.getByTestId('home-content')).toBeInTheDocument();
    });
    transitions.push(lastReceivedRoute.meta.transition);

    await act(async () => {
      routerInstance.router.navigate('/deep/nested/route');
    });
    await waitFor(() => {
      expect(screen.getByTestId('deep-content')).toBeInTheDocument();
    });
    transitions.push(lastReceivedRoute.meta.transition);

    await act(async () => {
      routerInstance.router.navigate('/about');
    });
    await waitFor(() => {
      expect(screen.getByTestId('about-content')).toBeInTheDocument();
    });
    transitions.push(lastReceivedRoute.meta.transition);

    await act(async () => {
      routerInstance.router.navigate('/home');
    });
    await waitFor(() => {
      expect(screen.getByTestId('home-content')).toBeInTheDocument();
    });
    transitions.push(lastReceivedRoute.meta.transition);

    // 验证过渡类型序列正确
    expect(transitions).toEqual(['slide-left', 'slide-left', 'slide-right', 'slide-left']);
  });

  it('should provide the latest route to customRender even with async guards', async () => {
    // 添加异步 beforeEach 守卫
    routerInstance.beforeEach(async (to, from) => {
      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 50));
      return true;
    });

    render(<routerInstance.RouterProvider />);

    await act(async () => {
      routerInstance.router.navigate('/home');
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-content')).toBeInTheDocument();
    });

    await waitFor(() => {
      // 验证即使在异步守卫后，customRender 也能收到最新的 route
      expect(lastReceivedRoute).toBeDefined();
      expect(lastReceivedRoute.path).toBe('/home');
      expect(lastReceivedRoute.meta.transition).toBeDefined();
    });
  });
});

describe('RouterView Async Test Suites', () => {
  const MockAsyncComp = () => {
    return <div data-testid="async-content">Async Component Loaded</div>;
  };

  // 模拟延迟的组件加载
  const createDelayedImport = (delay = 200) => {
    return () =>
      new Promise<{ default: React.ComponentType }>((resolve) => {
        setTimeout(() => {
          resolve({ default: MockAsyncComp });
        }, delay);
      });
  };

  let routerInstance: RouterInstance = {} as RouterInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    routerInstance = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: <RouterView />,
          children: [
            {
              path: '/home',
              component: createDelayedImport(300),
              meta: {
                loadingComponent: <div data-testid="custom-loading">Custom Loading...</div>,
              },
            },
            {
              path: '/fast',
              component: () => import('./Comp'),
            },
            {
              path: '/sync',
              component: <div data-testid="sync-content">Sync Component</div>,
            },
          ],
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
    routerInstance.clearAll();
  });

  it('should show fallback loading state and then render asynchronous component', async () => {
    render(<routerInstance.RouterProvider />);

    await act(async () => {
      routerInstance.router.navigate('/home');
    });

    // 1. 应该先显示 loading 状态
    await waitFor(() => {
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    // 2. 等待异步组件加载完成
    await waitFor(
      () => {
        expect(screen.getByTestId('async-content')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    // 3. 验证 loading 状态已消失
    expect(screen.queryByTestId('custom-loading')).not.toBeInTheDocument();

    // 4. 验证异步组件内容正确显示
    expect(screen.getByText('Async Component Loaded')).toBeInTheDocument();
  });

  it('should handle fast loading components without showing loading state briefly', async () => {
    render(<routerInstance.RouterProvider />);

    await act(async () => {
      routerInstance.router.navigate('/fast');
    });

    // 快速加载的组件可能不会显示 loading，或者显示时间极短
    // 我们主要验证最终能正确渲染
    await waitFor(
      () => {
        expect(screen.getByTestId('async-comp')).toBeInTheDocument();
      },
      { timeout: 500 },
    );

    // 验证没有残留的 loading 状态
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should render synchronous components immediately without loading state', async () => {
    render(<routerInstance.RouterProvider />);

    await act(async () => {
      routerInstance.router.navigate('/sync');
    });

    // 同步组件应该立即渲染，不显示 loading
    expect(screen.getByTestId('sync-content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByTestId('custom-loading')).not.toBeInTheDocument();
  });

  it('should handle navigation between asynchronous routes correctly', async () => {
    render(<routerInstance.RouterProvider />);

    // 先导航到快速加载的路由
    await act(async () => {
      routerInstance.router.navigate('/fast');
    });

    await waitFor(() => {
      expect(screen.getByTestId('async-comp')).toBeInTheDocument();
    });

    // 然后导航到慢速加载的路由
    await act(async () => {
      routerInstance.router.navigate('/home');
    });

    // 应该再次显示 loading 状态
    await waitFor(() => {
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    // 最终加载完成
    await waitFor(() => {
      expect(screen.getByTestId('async-content')).toBeInTheDocument();
    });
  });
});
