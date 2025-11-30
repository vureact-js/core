import { vOn } from '../vOn';

describe('vOn', () => {
  let mockHandler: jest.Mock;
  let mockEvent: any;

  beforeEach(() => {
    mockHandler = jest.fn();
    mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
      target: { id: 'target' },
      currentTarget: { id: 'currentTarget' },
      button: 0,
      key: '',
    };
  });

  describe('基础功能', () => {
    it('应将事件名转换为 React 格式', () => {
      const result = vOn('click', mockHandler);
      expect(result).toHaveProperty('onClick');
      expect(typeof result.onClick).toBe('function');
    });

    it('无修饰符时应调用处理器并传递所有参数', () => {
      const result = vOn('click', mockHandler);
      result.onClick(mockEvent, 'arg1', 'arg2');

      expect(mockHandler).toHaveBeenCalledWith(mockEvent, 'arg1', 'arg2');
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('.stop 修饰符', () => {
    it('应调用 stopPropagation', () => {
      const result = vOn('click.stop', mockHandler);
      result.onClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('.prevent 修饰符', () => {
    it('应调用 preventDefault', () => {
      const result = vOn('click.prevent', mockHandler);
      result.onClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('.self 修饰符', () => {
    it('当 target !== currentTarget 时不触发处理器', () => {
      const result = vOn('click.self', mockHandler);
      mockEvent.target = { id: 'different' };

      result.onClick(mockEvent);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('当 target === currentTarget 时触发处理器', () => {
      const result = vOn('click.self', mockHandler);
      mockEvent.target = mockEvent.currentTarget;

      result.onClick(mockEvent);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('.once 修饰符', () => {
    it('应只执行一次', () => {
      const result = vOn('click.once', mockHandler);

      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1); // 第二次不执行
    });

    it('不同 vOn 实例之间的 once 状态应隔离', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const result1 = vOn('click.once', handler1);
      const result2 = vOn('click.once', handler2);

      // 第一次调用
      result1.onClick(mockEvent);
      result2.onClick(mockEvent);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      // 第二次调用
      result1.onClick(mockEvent);
      result2.onClick(mockEvent);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('鼠标按键修饰符', () => {
    beforeEach(() => {
      mockEvent.button = 0; // 左键
    });

    it('.left 只在左键触发', () => {
      const result = vOn('click.left', mockHandler);

      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      mockEvent.button = 1; // 中键
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1); // 未增加
    });

    it('.middle 只在中键触发', () => {
      const result = vOn('click.middle', mockHandler);

      mockEvent.button = 1;
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      mockEvent.button = 0;
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('.right 只在右键触发', () => {
      const result = vOn('click.right', mockHandler);

      mockEvent.button = 2; // 右键
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      mockEvent.button = 0;
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  // __tests__/vOn.test.ts - 修正键盘事件测试
  describe('键盘按键修饰符', () => {
    it('.enter 只在 Enter 键触发', () => {
      const result = vOn('keydown.enter', mockHandler);
      mockEvent.key = 'Enter';

      result.onKeydown(mockEvent); // 改为 onKeydown
      expect(mockHandler).toHaveBeenCalledTimes(1);

      mockEvent.key = 'Escape';
      result.onKeydown(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('.esc 只在 Escape 键触发', () => {
      const result = vOn('keydown.esc', mockHandler);
      mockEvent.key = 'Escape';

      result.onKeydown(mockEvent); // 改为 onKeydown
      expect(mockHandler).toHaveBeenCalledTimes(1);

      mockEvent.key = 'Enter';
      result.onKeydown(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('.space 只在空格键触发', () => {
      const result = vOn('keydown.space', mockHandler);
      mockEvent.key = ' ';

      result.onKeydown(mockEvent); // 改为 onKeydown
      expect(mockHandler).toHaveBeenCalledTimes(1);

      mockEvent.key = 'Enter';
      result.onKeydown(mockEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  // 修复多修饰符组合测试
  it('.stop.self 若 self 失败应不执行 stop 和 handler', () => {
    const result = vOn('click.stop.self', mockHandler);
    mockEvent.target = { id: 'different' }; // self 验证失败

    result.onClick(mockEvent);

    expect(mockEvent.stopPropagation).not.toHaveBeenCalled(); // 现在会通过
    expect(mockHandler).not.toHaveBeenCalled();
  });

  // 修复参数传递测试
  it('应正确处理多个不同事件的参数', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const result1 = vOn('click', handler1);
    const result2 = vOn('input', handler2); // input 事件

    result1.onClick(mockEvent, 'clickArg');
    result2.onInput({ target: { value: 'test' } }, 'inputArg'); // 改为 onInput

    expect(handler1).toHaveBeenCalledWith(mockEvent, 'clickArg');
    expect(handler2).toHaveBeenCalledWith({ target: { value: 'test' } }, 'inputArg');
  });

  describe('多修饰符组合', () => {
    it('.stop.prevent 应顺序执行', () => {
      const result = vOn('click.stop.prevent', mockHandler);
      result.onClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('.self.stop 应在 self 通过后执行 stop', () => {
      const result = vOn('click.self.stop', mockHandler);
      mockEvent.target = mockEvent.currentTarget;

      result.onClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('.stop.self 若 self 失败应不执行 stop 和 handler', () => {
      const result = vOn('click.stop.self', mockHandler);
      mockEvent.target = { id: 'different' };

      result.onClick(mockEvent);

      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('.once.stop 应只执行一次并 stop', () => {
      const result = vOn('click.once.stop', mockHandler);

      result.onClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      result.onClick(mockEvent);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1); // 未增加
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('事件对象安全性', () => {
    it('应优雅处理 null 事件', () => {
      const result = vOn('click.stop', mockHandler);

      expect(() => result.onClick(null)).not.toThrow();
      expect(mockHandler).toHaveBeenCalledWith(null);
    });

    it('应优雅处理 undefined 事件', () => {
      const result = vOn('click.prevent', mockHandler);

      expect(() => result.onClick(undefined)).not.toThrow();
      expect(mockHandler).toHaveBeenCalledWith(undefined);
    });

    it('应处理缺少方法的事件对象', () => {
      const result = vOn('click.stop.prevent', mockHandler);
      const bareEvent = { target: {}, currentTarget: {} };

      expect(() => result.onClick(bareEvent)).not.toThrow();
      expect(mockHandler).toHaveBeenCalledWith(bareEvent);
    });
  });

  describe('参数传递完整性', () => {
    it('应保留所有参数包括事件对象', () => {
      const result = vOn('click', mockHandler);
      const customArgs = ['arg1', 2, { foo: 'bar' }];

      result.onClick(mockEvent, ...customArgs);

      expect(mockHandler).toHaveBeenCalledWith(mockEvent, ...customArgs);
    });

    it('带修饰符时应保留参数', () => {
      const result = vOn('click.stop', mockHandler);
      const customArgs = ['customArg'];

      result.onClick(mockEvent, ...customArgs);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalledWith(mockEvent, ...customArgs);
    });

    it('应正确处理多个不同事件的参数', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const result1 = vOn('click', handler1);
      const result2 = vOn('input', handler2);

      result1.onClick(mockEvent, 'clickArg');
      result2.onInput({ target: { value: 'test' } }, 'inputArg');

      expect(handler1).toHaveBeenCalledWith(mockEvent, 'clickArg');
      expect(handler2).toHaveBeenCalledWith({ target: { value: 'test' } }, 'inputArg');
    });
  });

  describe('边界情况', () => {
    it('应处理空修饰符', () => {
      const result = vOn('click.', mockHandler);
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('应处理不存在的修饰符', () => {
      const result = vOn('click.nonexistent', mockHandler);
      result.onClick(mockEvent);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('应处理不支持的事件方法', () => {
      const event = { target: {}, currentTarget: {} }; // 没有 stopPropagation
      const result = vOn('click.stop', mockHandler);

      expect(() => result.onClick(event)).not.toThrow();
      expect(mockHandler).toHaveBeenCalled();
    });
  });
});
