import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider, useInject } from '../Provider';
import { contextRegistry } from '../Provider/registry';

// 测试组件
const TestComponent = ({
  name,
  defaultValue,
  treatDefaultAsFactory,
}: {
  name: string | number | symbol;
  defaultValue?: any;
  treatDefaultAsFactory?: true;
}) => {
  // 根据参数调用不同的重载
  const value =
    treatDefaultAsFactory !== undefined
      ? useInject(name, defaultValue, treatDefaultAsFactory)
      : defaultValue !== undefined
        ? useInject(name, defaultValue)
        : useInject(name);

  return (
    <div data-testid={`test-${String(name)}`}>
      {value === undefined ? 'undefined' : JSON.stringify(value)}
    </div>
  );
};

describe('useInject', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    contextRegistry.clear();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('基本功能', () => {
    test('有 Provider 时返回值', () => {
      render(
        <Provider name="test" value="provided">
          <TestComponent name="test" />
        </Provider>,
      );

      expect(screen.getByTestId('test-test')).toHaveTextContent('"provided"');
    });

    test('无 Provider 且无默认值时返回 undefined', () => {
      render(<TestComponent name="missing" />);

      expect(screen.getByTestId('test-missing')).toHaveTextContent('undefined');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context with name "missing" not found'),
      );
    });
  });

  describe('默认值功能', () => {
    test('使用值作为默认值', () => {
      render(<TestComponent name="with-default" defaultValue="default" />);

      expect(screen.getByTestId('test-with-default')).toHaveTextContent('"default"');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('Provider 值覆盖默认值', () => {
      render(
        <Provider name="override" value="from-provider">
          <TestComponent name="override" defaultValue="default" />
        </Provider>,
      );

      expect(screen.getByTestId('test-override')).toHaveTextContent('"from-provider"');
    });

    test('Provider 提供 undefined 时使用默认值', () => {
      render(
        <Provider name="undefined-provider" value={undefined}>
          <TestComponent name="undefined-provider" defaultValue="default" />
        </Provider>,
      );

      expect(screen.getByTestId('test-undefined-provider')).toHaveTextContent('"default"');
    });
  });

  describe('工厂函数默认值', () => {
    test('使用工厂函数作为默认值', () => {
      const factory = jest.fn(() => 'factory-result');

      render(<TestComponent name="factory" defaultValue={factory} treatDefaultAsFactory={true} />);

      expect(screen.getByTestId('test-factory')).toHaveTextContent('"factory-result"');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('工厂函数只被调用一次', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return `result-${callCount}`;
      };

      const Component = () => {
        const value1 = useInject('factory-once', factory, true);
        const value2 = useInject('factory-once', factory, true); // 第二个消费点

        return (
          <div>
            <span data-testid="value1">{value1}</span>
            <span data-testid="value2">{value2}</span>
          </div>
        );
      };

      render(<Component />);

      expect(screen.getByTestId('value1')).toHaveTextContent('result-1');
      expect(screen.getByTestId('value2')).toHaveTextContent('result-1'); // 应该是相同的值
    });

    test('工厂函数在重新渲染时保持结果', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return callCount;
      };

      const Component = ({ toggle }: { toggle: boolean }) => {
        const value = useInject('counter', factory, true);
        return <div data-testid="value">{value}</div>;
      };

      const { rerender } = render(<Component toggle={false} />);
      expect(callCount).toBe(1);

      rerender(<Component toggle={true} />);
      expect(callCount).toBe(1); // 重新渲染时工厂函数不会被再次调用
      expect(screen.getByTestId('value')).toHaveTextContent('1');
    });

    test('Provider 存在时工厂函数不被调用', () => {
      const factory = jest.fn(() => 'factory-result');

      render(
        <Provider name="factory-no-call" value="provider-value">
          <TestComponent
            name="factory-no-call"
            defaultValue={factory}
            treatDefaultAsFactory={true}
          />
        </Provider>,
      );

      expect(screen.getByTestId('test-factory-no-call')).toHaveTextContent('"provider-value"');
      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe('类型安全', () => {
    test('类型推断正确', () => {
      // 这些应该通过 TypeScript 类型检查
      const Component = () => {
        // 无默认值
        const v1 = useInject<string>('key1'); // string | undefined

        // 有默认值（值）
        const v2 = useInject('key2', 'default'); // string

        // 有默认值（工厂函数）
        const v3 = useInject('key3', () => 'default', true); // string

        return null;
      };

      expect(() => render(<Component />)).not.toThrow();
    });
  });
});
