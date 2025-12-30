import '@testing-library/jest-dom';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import {
  createRouter,
  createWebHistory,
  RouterInstance,
  RouterView,
  useBeforeRouteLeave,
  useBeforeRouteUpdate,
} from '../';

describe('Component Guards Test Suites', () => {
  let routerInstance: RouterInstance = {} as RouterInstance;

  const mockConfirm = jest.fn();
  const mockGuard = jest.fn();
  const mockGuard2 = jest.fn();

  const Home = () => {
    return (
      <div data-testid="home">
        <RouterView />
      </div>
    );
  };

  const UserProfile = ({ userId }: { userId?: string }) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useBeforeRouteLeave((to, from) => {
      if (hasUnsavedChanges) {
        return window.confirm('are you ok?');
      }
    });

    useBeforeRouteUpdate((to, from) => {
      if (to.params.userId !== from.params.userId) {
        console.log(`user id changed! ${from.params.userId} -> ${to.params.userId}`);
      }
    });

    return (
      <div data-testid="user-profile">
        User Profile {userId}
        <button onClick={() => setHasUnsavedChanges(true)} data-testid="make-changes">
          修改内容
        </button>
      </div>
    );
  };

  const Settings = () => {
    useBeforeRouteLeave(() => false); // 总是阻止离开

    return <div data-testid="settings">Settings Page</div>;
  };

  const AsyncLeaveComponent = () => {
    useBeforeRouteLeave(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return false; // 异步阻止
    });

    return <div data-testid="async-leave">Async Leave Component</div>;
  };

  const Other = () => {
    useBeforeRouteLeave(mockGuard);
    return <div data-testid="other">Other Page</div>;
  };

  const BlockingUpdateComponent = () => {
    useBeforeRouteUpdate(() => false); // 总是阻止更新
    return <div data-testid="blocking-update">Blocking Update</div>;
  };

  const mockAllowUpdate = jest.fn((to, from) => true);

  const AllowingUpdateComponent = () => {
    useBeforeRouteUpdate(mockAllowUpdate); // 总是允许更新
    return <div data-testid="allowing-update">Allowing Update</div>;
  };

  const asyncUpdateMock = jest.fn();

  const AsyncUpdateComponent = () => {
    useBeforeRouteUpdate(async (to, from) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      asyncUpdateMock(to.params.id, from.params.id);
    });
    return <div data-testid="async-update">Async Update</div>;
  };

  const TestComponent = () => {
    useBeforeRouteUpdate(mockGuard2);
    return <div data-testid="test-update">Test Update</div>;
  };

  const executionOrder: string[] = [];
  const executionOrder2: string[] = [];

  const TestComponent2 = () => {
    useBeforeRouteLeave(() => {
      executionOrder.push('beforeRouteLeave');
      return true;
    });
    return <div data-testid="execution-test">Execution Test</div>;
  };

  const TestComponent3 = () => {
    useBeforeRouteUpdate(() => {
      executionOrder2.push('beforeRouteUpdate');
    });
    return <div>Test</div>;
  };

  const routerOptions = () => ({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: <Home />,
        children: [
          {
            path: 'user/:userId',
            component: <UserProfile />,
          },
          {
            path: 'settings',
            component: <Settings />,
          },
          {
            path: 'async-leave',
            component: <AsyncLeaveComponent />,
          },
          {
            path: 'other',
            component: <Other />,
          },
          {
            path: 'block/:id',
            component: <BlockingUpdateComponent />,
          },
          {
            path: '/allow/:id',
            component: <AllowingUpdateComponent />,
          },
          {
            path: '/async/:id',
            component: <AsyncUpdateComponent />,
          },
          {
            path: '/test-update/:id',
            component: <TestComponent />,
          },
          {
            path: 'execution',
            component: <TestComponent2 />,
          },
          {
            path: 'target',
            component: <div>Target</div>,
          },
          {
            path: 'order/:id',
            component: <TestComponent3 />,
            beforeEnter: () => {
              executionOrder2.push('beforeEnter');
            },
          },
        ],
      },
    ],
  });

  beforeAll(() => {
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: mockConfirm,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(false); // 默认不允许导航
    routerInstance = createRouter(routerOptions());
  });

  afterEach(() => {
    cleanup();
    routerInstance.clearAll();
    window.history.pushState({}, '', '/');
  });

  describe('useBeforeRouteLeave', () => {
    it('should call beforeRouteLeave when navigating away from component', async () => {
      render(<routerInstance.RouterProvider />);

      expect(screen.getByTestId('home')).toBeInTheDocument();

      // 导航到用户页面
      await act(async () => {
        routerInstance.router.navigate('/user/123');
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });

      // 模拟用户进行了修改
      act(() => {
        screen.getByTestId('make-changes').click();
      });

      // 尝试导航离开
      await act(async () => {
        routerInstance.router.navigate('/other');
      });

      // 应该弹出了确认对话框
      expect(mockConfirm).toHaveBeenCalledWith('are you ok?');
    });

    it('should prevent navigation when beforeRouteLeave returns false', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到设置页面（该页面总是阻止离开）
      await act(async () => {
        routerInstance.router.navigate('/settings');
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings')).toBeInTheDocument();
      });

      // 尝试导航离开
      await act(async () => {
        routerInstance.router.navigate('/other');
      });

      // 应该仍然在设置页面
      expect(screen.getByTestId('settings')).toBeInTheDocument();
      expect(screen.queryByTestId('other')).not.toBeInTheDocument();
    });

    it('should allow navigation when beforeRouteLeave returns true', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到用户页面
      await act(async () => {
        routerInstance.router.navigate('/user/123');
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });

      // 模拟用户进行了修改
      act(() => {
        screen.getByTestId('make-changes').click();
      });

      // 尝试导航离开
      await act(async () => {
        routerInstance.router.navigate('/other');
        mockConfirm.mockReturnValue(true); // 用户确认离开
      });

      // 应该成功导航到其他页面
      await waitFor(() => {
        expect(screen.getByTestId('other')).toBeInTheDocument();
      });
    });

    it('should work with async beforeRouteLeave guards', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到异步离开组件
      await act(async () => {
        routerInstance.router.navigate('/async-leave');
      });

      await waitFor(() => {
        expect(screen.getByTestId('async-leave')).toBeInTheDocument();
      });

      // 尝试导航离开
      await act(async () => {
        routerInstance.router.navigate('/other');
      });

      await waitFor(() => {
        // 异步守卫应该阻止了导航
        expect(screen.getByTestId('async-leave')).toBeInTheDocument();
        expect(screen.queryByTestId('other')).not.toBeInTheDocument();
      });
    });

    it('should not call beforeRouteLeave when navigating within same route', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到 other 页面
      await act(async () => {
        routerInstance.router.navigate('/other');
      });

      await waitFor(() => {
        expect(screen.getByTestId('other')).toBeInTheDocument();
      });

      // 刷新页面（相同路由）
      await act(async () => {
        routerInstance.router.navigate('/other');
      });

      // 守卫不应该被调用
      expect(mockGuard).not.toHaveBeenCalled();
    });
  });

  describe('useBeforeRouteUpdate', () => {
    it('should call beforeRouteUpdate when route params change', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<routerInstance.RouterProvider />);

      // 导航到用户123
      await act(async () => {
        routerInstance.router.navigate('/user/123');
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });

      // 导航到用户456（参数变化）
      await act(async () => {
        routerInstance.router.navigate('/user/456');
      });

      // 应该调用了 beforeRouteUpdate
      expect(consoleSpy).toHaveBeenCalledWith('user id changed! 123 -> 456');

      consoleSpy.mockRestore();
    });

    it('should prevent navigation when beforeRouteUpdate returns false', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到 block/1
      await act(async () => {
        routerInstance.router.navigate('/block/1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('blocking-update')).toBeInTheDocument();
      });

      // 尝试导航到 block/2
      await act(async () => {
        routerInstance.router.navigate('/block/2');
      });

      // 应该仍然在 block/1
      expect(screen.getByTestId('blocking-update')).toBeInTheDocument();
    });

    it('should allow navigation when beforeRouteUpdate returns true', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到 allow/1
      await act(async () => {
        routerInstance.router.navigate('/allow/1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('allowing-update')).toBeInTheDocument();
      });

      // 导航到 allow/2
      await act(async () => {
        routerInstance.router.navigate('/allow/2');
      });

      // 应该成功更新到新参数
      expect(mockAllowUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/allow/2',
          params: { id: '2' },
        }),
        expect.objectContaining({ path: '/allow/1', params: { id: '1' } }),
      );

      expect(screen.getByTestId('allowing-update')).toBeInTheDocument();
    });

    it('should work with async beforeRouteUpdate guards', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到 async/1
      await act(async () => {
        routerInstance.router.navigate('/async/1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('async-update')).toBeInTheDocument();
      });

      // 导航到 async/2
      await act(async () => {
        routerInstance.router.navigate('/async/2');
      });

      // 等待异步守卫完成
      await waitFor(() => {
        expect(asyncUpdateMock).toHaveBeenCalledWith('2', '1');
      });
    });

    it('should not call beforeRouteUpdate when navigating to different route', async () => {
      render(<routerInstance.RouterProvider />);

      // 导航到 test-update/1
      await act(async () => {
        routerInstance.router.navigate('/test-update/1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('test-update')).toBeInTheDocument();
      });

      // 导航到完全不同的路由
      await act(async () => {
        routerInstance.router.navigate('/other');
      });

      // 守卫不应该被调用
      expect(mockGuard2).not.toHaveBeenCalled();
    });
  });

  describe('Execution Order', () => {
    it('should execute beforeRouteLeave before beforeEach', async () => {
      // 注册全局守卫
      routerInstance.beforeEach(() => {
        executionOrder.push('beforeEach');
      });

      render(<routerInstance.RouterProvider />);

      // 导航到测试页面，因为是首次挂载所以 beforeRouteLeave 不执行，而 beforeEach 正常执行
      await act(async () => {
        routerInstance.router.navigate('/execution');
      });

      await waitFor(() => {
        expect(screen.getByTestId('execution-test')).toBeInTheDocument();
      });

      // 导航离开，beforeRouteLeave 执行 -> beforeEach 执行
      await act(async () => {
        routerInstance.router.navigate('/target');
      });

      // 验证执行顺序
      expect(executionOrder).toEqual(['beforeEach', 'beforeRouteLeave', 'beforeEach']);
    });

    it('should execute beforeRouteUpdate after beforeEach and before beforeEnter', async () => {
      // 注册全局守卫
      routerInstance.beforeEach(() => {
        executionOrder2.push('beforeEach');
      });

      render(<routerInstance.RouterProvider />);

      // 导航到 order/1
      await act(async () => {
        routerInstance.router.navigate('/order/1');
      });

      // 导航到 order/2（参数变化）
      await act(async () => {
        routerInstance.router.navigate('/order/2');
      });

      // 验证执行顺序
      expect(executionOrder2).toEqual(['beforeEach', 'beforeEnter', 'beforeRouteUpdate']);
    });
  });
});
