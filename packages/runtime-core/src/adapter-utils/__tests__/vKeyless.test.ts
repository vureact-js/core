import { vKeyless } from '../vKeyless';

describe('vKeyless Integration Tests (No Mocks)', () => {
  // 1. 基础属性与重命名测试 (依赖 shared.ts)
  describe('Attribute Mapping & Passthrough', () => {
    test('should pass through standard attributes', () => {
      const input = { id: 'app', placeholder: 'Enter text' };
      const result = vKeyless(input);
      expect(result).toEqual({ id: 'app', placeholder: 'Enter text' });
    });

    test('should rename specific Vue attributes using shared logic', () => {
      const input = {
        for: 'input-id', // -> htmlFor
        'v-html': '<span></span>', // -> dangerouslySetInnerHTML
        'data-test': '123', // -> data-test (whitelist)
        'custom-attr': 'val', // -> customAttr (camelCase)
      };

      const result = vKeyless(input);

      expect(result).toEqual({
        htmlFor: 'input-id',
        dangerouslySetInnerHTML: '<span></span>',
        'data-test': '123',
        customAttr: 'val',
      });
    });
  });

  // 2. Class 处理集成测试 (依赖 vBindCls.ts)
  describe('Class Integration', () => {
    test('should normalize string class', () => {
      const result = vKeyless({ class: '  btn   btn-primary  ' });
      expect(result).toEqual({ className: 'btn btn-primary' });
    });

    test('should handle object syntax', () => {
      const input = {
        class: 'base-class',
        className: { extra: true },
      };

      const result = vKeyless(input);
      // 'base-class' 与 'extra' 合并
      expect(result).toEqual({ className: 'base-class extra' });
    });

    test('should handle array syntax', () => {
      const result = vKeyless({ class: ['a', { b: true }] });
      expect(result).toEqual({ className: 'a b' });
    });

    test('should merge "class" and "className" if both are present', () => {
      // 传入一个包含 class 和 className 的对象，模拟 v-bind 的输入
      const input = {
        class: 'base-class',
        className: { extra: true }, // vBindCls 应该能处理对象并返回 'extra'
      };

      const result = vKeyless(input);
      // vBindCls 会将 'base-class' 与 'extra' 合并 (依赖 vBindCls.ts 的 mergeClassStrings)
      expect(result).toEqual({ className: 'base-class extra' });
    });
  });

  // 3. Style 处理集成测试
  describe('Style Integration', () => {
    test('should merge array of style objects', () => {
      const input = {
        style: [
          { color: 'red', display: 'block' },
          { fontSize: '12px', display: 'none' }, // 后者覆盖前者
        ],
      };

      const result = vKeyless(input);
      expect(result).toEqual({
        style: {
          color: 'red',
          fontSize: '12px',
          display: 'none',
        },
      });
    });

    test('should pass through normal style objects', () => {
      const style = { margin: '10px' };
      const result = vKeyless({ style });
      expect(result).toEqual({ style: { margin: '10px' } });
    });
  });

  // 4. 事件处理集成测试 (依赖 vOn.ts)
  describe('Event Integration', () => {
    test('should normalize event names (e.g., "click" to "onClick")', () => {
      const handler = jest.fn();
      // 'click' 现在会被新的 vKeyless 逻辑捕获并交给 vOn 处理，生成 'onClick' 属性
      const result = vKeyless({ click: handler });

      expect(result.onClick).toBeDefined();
      expect(typeof result.onClick).toBe('function');

      // 执行生成的函数，确保它调用了原始 handler
      result.onClick();
      expect(handler).toHaveBeenCalled();
    });

    test('should handle modifiers correctly (runtime integration)', () => {
      const handler = jest.fn();
      // 使用 .stop 修饰符
      const result = vKeyless({ 'click.stop': handler });

      expect(result.onClick).toBeDefined();

      // 模拟事件对象
      const mockEvent = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
      };

      // 触发事件
      result.onClick(mockEvent);

      // 验证 vOn 逻辑是否生效：stopPropagation 应该被调用
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      // 原始 handler 也应该被调用
      expect(handler).toHaveBeenCalled();
    });

    test('should handle key modifiers', () => {
      const handler = jest.fn();
      // 只有按下 enter 键才触发
      const result = vKeyless({ 'keyup.enter': handler });

      // 模拟错误的按键 (Space)
      result.onKeyup({ key: ' ' });
      expect(handler).not.toHaveBeenCalled();

      // 模拟正确的按键 (Enter)
      result.onKeyup({ key: 'Enter' });
      expect(handler).toHaveBeenCalled();
    });
  });

  // 5. 复杂混合场景
  describe('Complex Scenarios', () => {
    test('should handle a mix of everything', () => {
      const handler = () => {};
      const input = {
        id: 'main',
        class: ['container', { fluid: true }],
        style: [{ color: 'black' }],
        'click.prevent': handler,
        'data-role': 'admin',
      };

      const result = vKeyless(input);

      // 验证结构
      expect(result.id).toBe('main');
      expect(result.className).toBe('container fluid');
      expect(result.style).toEqual({ color: 'black' });
      expect(result['data-role']).toBe('admin');

      // 验证事件修饰符集成
      const mockEvent = { preventDefault: jest.fn() };
      result.onClick(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });
});
