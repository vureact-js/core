import { vBind } from '../vBind';

describe('vBind', () => {
  describe('静态键名绑定', () => {
    it('应处理单个静态属性', () => {
      const result = vBind('className', 'foo');
      expect(result).toEqual({ className: 'foo' });
    });

    it('应支持 data-* 属性', () => {
      const result = vBind('data-id', '123');
      expect(result).toEqual({ 'data-id': '123' });
    });

    it('应支持值为各种类型', () => {
      expect(vBind('count', 0)).toEqual({ count: 0 });
      expect(vBind('visible', true)).toEqual({ visible: true });
      expect(vBind('obj', { a: 1 })).toEqual({ obj: { a: 1 } });
      expect(vBind('arr', [1, 2])).toEqual({ arr: [1, 2] });
      expect(vBind('fn', () => {})).toEqual({ fn: expect.any(Function) });
    });
  });

  describe('对象语法绑定', () => {
    it('应展开对象的所有属性', () => {
      const obj = { id: 'foo', className: 'bar', 'data-test': 'baz' };
      const result = vBind(obj);
      expect(result).toEqual(obj);
    });

    it('应创建对象副本而非引用', () => {
      const obj = { a: 1 };
      const result = vBind(obj);
      expect(result).toEqual(obj);
      expect(result).not.toBe(obj); // 不是同一个引用
    });

    it('应处理空对象', () => {
      const result = vBind({});
      expect(result).toEqual({});
    });
  });

  describe('边界情况', () => {
    it('应处理 keyOrObj 为 undefined', () => {
      const result = vBind(undefined as any);
      expect(result).toEqual({});
    });

    it('应处理 keyOrObj 为 null 且无 dynamicKey', () => {
      const result = vBind(null);
      expect(result).toEqual({});
    });

    it('应处理值为 undefined', () => {
      const result = vBind('foo', undefined);
      expect(result).toEqual({ foo: undefined });
    });

    it('应处理值为 null', () => {
      const result = vBind('foo', null);
      expect(result).toEqual({ foo: null });
    });
  });

  describe('与 JSX 集成场景', () => {
    it('应生成可展开的 props 对象', () => {
      const props = vBind('className', 'btn');
      const element = { type: 'div', props };
      expect(element.props).toEqual({ className: 'btn' });
    });

    it('对象结果应与静态结果合并', () => {
      const staticProps = { id: 'test' };
      const dynamicProps = vBind({ className: 'foo', disabled: true });

      expect({ ...staticProps, ...dynamicProps }).toEqual({
        id: 'test',
        className: 'foo',
        disabled: true,
      });
    });
  });

  describe('编译器代码生成场景', () => {
    it('模拟 :class="inputClass" 编译', () => {
      const inputClass = 'form-input';
      const result = vBind('className', inputClass);
      expect(result).toEqual({ className: 'form-input' });
    });

    it('模拟 v-bind="{ foo, bar }" 编译', () => {
      const foo = 'a';
      const bar = 'b';
      const result = vBind({ foo, bar });
      expect(result).toEqual({ foo: 'a', bar: 'b' });
    });
  });
});
