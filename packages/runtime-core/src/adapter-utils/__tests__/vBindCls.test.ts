import { vBindCls } from '../vBindCls';

describe('vBindCls', () => {
  describe('基本功能', () => {
    it('应处理字符串输入', () => {
      expect(vBindCls('foo')).toBe('foo');
      expect(vBindCls('foo bar')).toBe('foo bar');
      expect(vBindCls('')).toBe('');
    });

    it('应规范化字符串中的多余空格', () => {
      expect(vBindCls('foo  bar   baz')).toBe('foo bar baz');
      expect(vBindCls('  foo  ')).toBe('foo');
      expect(vBindCls('a   b    c')).toBe('a b c');
    });

    it('应处理条件对象', () => {
      expect(vBindCls({ active: true })).toBe('active');
      expect(vBindCls({ active: false })).toBe('');
      expect(vBindCls({ 'active-class': true, foo: false })).toBe('active-class');
    });

    it('应处理数组输入', () => {
      expect(vBindCls(['a', 'b', 'c'])).toBe('a b c');
      expect(vBindCls(['a', { b: true }, 'c'])).toBe('a b c');
      expect(vBindCls([{ a: true }, { b: false }])).toBe('a');
    });

    it('应递归处理嵌套数组', () => {
      expect(vBindCls(['a', ['b', 'c']])).toBe('a b c');
      expect(vBindCls([['x', ['y']], 'z'])).toBe('x y z');
    });
  });

  describe('additional 参数', () => {
    it('应合并字符串和字符串', () => {
      expect(vBindCls('foo', 'bar')).toBe('foo bar');
      expect(vBindCls('  foo  ', '  bar  ')).toBe('foo bar');
    });

    it('应合并字符串和对象', () => {
      expect(vBindCls('base', { active: true })).toBe('base active');
      expect(vBindCls('base', { active: false })).toBe('base');
    });

    it('应合并字符串和数组', () => {
      expect(vBindCls('foo', ['bar', 'baz'])).toBe('foo bar baz');
    });

    it('应合并对象和对象', () => {
      expect(vBindCls({ a: true }, { b: false, c: true })).toBe('a c');
    });

    it('应合并对象和数组', () => {
      expect(vBindCls({ foo: true }, ['bar', { baz: true }])).toBe('foo bar baz');
    });

    it('应合并数组和数组', () => {
      expect(vBindCls(['a', 'b'], ['c', 'd'])).toBe('a b c d');
    });

    it('应处理 undefined additional', () => {
      expect(vBindCls('foo', undefined)).toBe('foo');
    });
  });

  describe('去重逻辑', () => {
    it('应在合并时去除重复类名', () => {
      expect(vBindCls('foo bar', 'bar baz')).toBe('foo bar baz');
    });

    it('应保留第一个出现的顺序', () => {
      expect(vBindCls(['c', 'a', 'b'], ['a', 'd'])).toBe('c a b d');
    });

    it('应在多个来源之间去重', () => {
      const result = vBindCls(['a', 'b', 'c'], { b: true, d: true });
      expect(result).toBe('a b c d');
    });
  });

  describe('边界情况', () => {
    it('应处理 null 输入', () => {
      // @ts-ignore
      expect(vBindCls(null)).toBe('');
      // @ts-ignore
      expect(vBindCls('foo', null)).toBe('foo');
    });

    it('应处理 undefined 输入', () => {
      // @ts-ignore
      expect(vBindCls(undefined)).toBe('');
      expect(vBindCls('foo', undefined)).toBe('foo');
    });

    it('应处理空字符串', () => {
      expect(vBindCls('')).toBe('');
      expect(vBindCls('foo', '')).toBe('foo');
    });

    it('应处理空数组', () => {
      expect(vBindCls([])).toBe('');
      expect(vBindCls('foo', [])).toBe('foo');
    });

    it('应处理空对象', () => {
      expect(vBindCls({})).toBe('');
      expect(vBindCls('foo', {})).toBe('foo');
    });
  });

  describe('条件值类型', () => {
    it('应处理布尔值', () => {
      expect(vBindCls({ a: true, b: false })).toBe('a');
    });

    it('应处理 truthy/falsy 值', () => {
      expect(vBindCls({ a: 1, b: 0, c: 'string', d: '', e: null, f: undefined })).toBe('a c');
    });

    it('应处理函数返回值（true）', () => {
      const condition = () => true;
      expect(vBindCls({ a: condition })).toBe('a');
    });

    it('应处理函数返回值（false）', () => {
      const falseCondition = () => false;
      expect(vBindCls({ a: falseCondition })).toBe('');
    });

    it('应处理函数返回 truthy/falsy', () => {
      const truthyFn = () => 'truthy';
      const falsyFn = () => '';
      expect(vBindCls({ a: truthyFn, b: falsyFn })).toBe('a');
    });
  });

  describe('嵌套结构', () => {
    it('应处理深度嵌套数组', () => {
      expect(vBindCls([['a', ['b']], 'c'])).toBe('a b c');
    });

    it('应处理数组中的空值', () => {
      expect(vBindCls(['a', null, 'b', undefined, 'c'])).toBe('a b c');
    });

    it('应处理数组中的 false', () => {
      // 核心修复：确保 false 被过滤
      expect(vBindCls(['a', false, 'b', false, 'c'])).toBe('a b c');
    });
  });

  describe('特殊字符', () => {
    it('应处理包含连字符的类名', () => {
      expect(vBindCls({ 'active-class': true, 'my-class': false })).toBe('active-class');
    });

    it('应处理包含下划线的类名', () => {
      expect(vBindCls({ my_class: true, another_class: true })).toBe('my_class another_class');
    });
  });

  describe('Vue 兼容性', () => {
    it('应模拟 Vue 的数组处理方式（过滤 falsy）', () => {
      // Vue 会过滤掉数组中的 null/undefined/false
      expect(vBindCls(['a', null, 'b', false, 'c'])).toBe('a b c');
    });

    it('应模拟 Vue 的对象处理方式', () => {
      // Vue 会忽略值为 false/null/undefined 的键
      expect(vBindCls({ a: true, b: false, c: null, d: undefined, e: 1 })).toBe('a e');
    });

    it('应处理 Vue 的混合数组语法', () => {
      let isActive = true;
      expect(vBindCls(['static', { active: isActive }, 'class-b'])).toBe('static active class-b');
    });
  });

  describe('additional 去重边界', () => {
    it('应在 base 和 additional 之间去重', () => {
      expect(vBindCls('foo bar', 'bar baz')).toBe('foo bar baz');
    });

    it('应在多个来源之间去重（含数组）', () => {
      expect(vBindCls(['a', 'b'], ['b', 'c', 'a'])).toBe('a b c');
    });
  });

  describe('性能场景', () => {
    it('应快速处理大型数组', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `class-${i}`);
      const result = vBindCls(largeArray);
      expect(result.split(' ').length).toBe(1000);
    });

    it('应快速处理大型对象', () => {
      const largeObj: Record<string, boolean> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`class-${i}`] = i % 2 === 0;
      }
      const result = vBindCls(largeObj);
      expect(result.split(' ').length).toBe(500);
    });
  });
});
