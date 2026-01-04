import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CtxProvider, useCxtValue } from '../ContextProvider';
import { contextRegistry } from '../ContextProvider/registry';

// 测试组件
interface TestConsumerProps {
  name: string | number | symbol;
  label?: string;
}

const TestConsumer = ({ name, label = 'Value' }: TestConsumerProps) => {
  const value = useCxtValue(name);
  return (
    <div data-testid={`consumer-${String(name)}`}>
      {label}: {value === undefined ? 'undefined' : String(value)}
    </div>
  );
};

describe('Context Registry System', () => {
  beforeEach(() => {
    contextRegistry.clear();
  });

  // 测试1: 基本功能测试
  describe('Basic Functionality', () => {
    test('should provide and consume value with string key', () => {
      const TestComponent = () => (
        <CtxProvider name="test-key" value="test-value">
          <TestConsumer name="test-key" />
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByTestId('consumer-test-key')).toHaveTextContent('Value: test-value');
    });

    test('should provide and consume value with number key', () => {
      const TestComponent = () => (
        <CtxProvider name={123} value={456}>
          <TestConsumer name={123} />
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByTestId('consumer-123')).toHaveTextContent('Value: 456');
    });

    test('should provide and consume value with symbol key', () => {
      const symbolKey = Symbol('test');
      const TestComponent = () => (
        <CtxProvider name={symbolKey} value="symbol-value">
          <TestConsumer name={symbolKey} />
        </CtxProvider>
      );

      render(<TestComponent />);
      // Symbol作为键时，testid需要处理
      expect(screen.getByText('Value: symbol-value')).toBeInTheDocument();
    });
  });

  // 测试2: 嵌套Provider测试
  describe('Nested Providers', () => {
    test('should use innermost provider value', () => {
      const TestComponent = () => (
        <CtxProvider name="nested" value="outer">
          <CtxProvider name="nested" value="inner">
            <TestConsumer name="nested" />
          </CtxProvider>
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByTestId('consumer-nested')).toHaveTextContent('Value: inner');
    });

    test('should work with multiple nested consumers', () => {
      const TestComponent = () => (
        <CtxProvider name="multi" value="level1">
          <div>
            <TestConsumer name="multi" label="Level1" />
            <CtxProvider name="multi" value="level2">
              <TestConsumer name="multi" label="Level2" />
            </CtxProvider>
          </div>
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByText('Level1: level1')).toBeInTheDocument();
      expect(screen.getByText('Level2: level2')).toBeInTheDocument();
    });
  });

  // 测试3: 多键隔离测试。
  describe('Multiple Keys Isolation', () => {
    test('should handle multiple independent contexts', () => {
      const TestComponent = () => (
        <>
          <CtxProvider name="key1" value="value1">
            <TestConsumer name="key1" label="Key1" />
          </CtxProvider>
          <CtxProvider name="key2" value={42}>
            <TestConsumer name="key2" label="Key2" />
          </CtxProvider>
          <TestConsumer name="key3" label="Key3 (no provider)" />
        </>
      );

      render(<TestComponent />);
      expect(screen.getByText('Key1: value1')).toBeInTheDocument();
      expect(screen.getByText('Key2: 42')).toBeInTheDocument();

      //! 注意，控制台会打印错误信息：...key "key3" not found，这是正常的。
      expect(screen.getByText('Key3 (no provider): undefined')).toBeInTheDocument();
    });
  });

  // 测试4: 动态更新测试
  describe('Dynamic Updates', () => {
    test('should update when provider value changes', async () => {
      const { rerender } = render(
        <CtxProvider name="dynamic" value="initial">
          <TestConsumer name="dynamic" />
        </CtxProvider>,
      );

      expect(screen.getByTestId('consumer-dynamic')).toHaveTextContent('Value: initial');

      rerender(
        <CtxProvider name="dynamic" value="updated">
          <TestConsumer name="dynamic" />
        </CtxProvider>,
      );

      expect(screen.getByTestId('consumer-dynamic')).toHaveTextContent('Value: updated');
    });

    test('should handle stateful updates', async () => {
      const Counter = () => {
        const [count, setCount] = React.useState(0);

        return (
          <CtxProvider name="counter" value={count}>
            <div>
              <TestConsumer name="counter" label="Count" />
              <button onClick={() => setCount(count + 1)}>Increment</button>
            </div>
          </CtxProvider>
        );
      };

      render(<Counter />);
      expect(screen.getByText('Count: 0')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Increment'));
      await waitFor(() => {
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
      });
    });
  });

  // 测试5: 错误处理测试
  describe('Error Handling', () => {
    // 注意：需要模拟 console.error 来测试错误情况
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should handle missing provider gracefully', () => {
      render(<TestConsumer name="missing" label="Missing" />);

      expect(screen.getByText('Missing: undefined')).toBeInTheDocument();
      // 验证错误日志被调用
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context with key "missing" not found'),
      );
    });
  });

  // 测试6: 复杂数据类型测试
  describe('Complex Data Types', () => {
    test('should handle objects', () => {
      const objValue = { name: 'John', age: 30 };
      const TestComponent = () => (
        <CtxProvider name="user" value={objValue}>
          <TestConsumer name="user" />
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByTestId('consumer-user')).toHaveTextContent(
        'Value: [object Object]', // 注意：toString 结果
      );
    });

    test('should handle arrays', () => {
      const TestComponent = () => (
        <CtxProvider name="items" value={[1, 2, 3]}>
          <TestConsumer name="items" />
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByTestId('consumer-items')).toHaveTextContent('Value: 1,2,3');
    });

    test('should handle functions', () => {
      const fnValue = () => 'test';
      const TestComponent = () => (
        <CtxProvider name="callback" value={fnValue}>
          <TestConsumer name="callback" />
        </CtxProvider>
      );

      render(<TestComponent />);
      expect(screen.getByTestId('consumer-callback')).toHaveTextContent("Value: () => 'test'");
    });
  });

  // 测试7: TypeScript 类型安全测试
  describe('Type Safety', () => {
    // 这些测试主要验证 TypeScript 类型检查，在运行时可能没有明显表现
    test('should enforce value type consistency', () => {
      // 这段代码应该通过 TypeScript 类型检查
      const TypedComponent = () => (
        <CtxProvider name="typed" value="string">
          <TestConsumer name="typed" />
        </CtxProvider>
      );

      expect(() => render(<TypedComponent />)).not.toThrow();
    });
  });
});

// 性能测试套件
describe('Performance Tests', () => {
  test('should handle many contexts efficiently', () => {
    const ManyProviders = () => {
      const providers = Array.from({ length: 100 }, (_, i) => (
        <CtxProvider name={`key-${i}`} value={i} key={`provider-${i}`}>
          <TestConsumer name={`key-${i}`} label={`Consumer ${i}`} />
        </CtxProvider>
      ));

      return <>{providers}</>;
    };

    const startTime = performance.now();
    render(<ManyProviders />);
    const endTime = performance.now();

    // 验证渲染时间在可接受范围内
    expect(endTime - startTime).toBeLessThan(500); // 500ms 阈值
  });
});
