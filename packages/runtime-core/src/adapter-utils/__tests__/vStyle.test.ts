import { vStyle } from '../vStyle';

describe('vStyle', () => {
  // 1. 基础对象测试
  test('should handle single object', () => {
    const input = { color: 'red', fontSize: '14px' };
    const result = vStyle(input);
    expect(result).toEqual({ color: 'red', fontSize: '14px' });
  });

  // 2. 字符串解析测试
  test('should parse css text string into object', () => {
    const input = 'display: block; background-color: blue;';
    const result = vStyle(input);
    expect(result).toEqual({
      display: 'block',
      backgroundColor: 'blue', // 验证 camelCase 转换
    });
  });

  test('should handle messy string format', () => {
    // 无分号结尾，空格不规范
    const input = '  color : red  ; margin-top:10px ';
    const result = vStyle(input);
    expect(result).toEqual({ color: 'red', marginTop: '10px' });
  });

  // 3. 数组处理测试
  test('should merge array of objects', () => {
    const input = [{ color: 'red' }, { display: 'flex' }];
    const result = vStyle(input);
    expect(result).toEqual({ color: 'red', display: 'flex' });
  });

  test('should handle mixed array (string + object)', () => {
    const input = ['width: 100px', { height: '200px' }];
    const result = vStyle(input);
    expect(result).toEqual({ width: '100px', height: '200px' });
  });

  test('should flatten nested arrays', () => {
    const input = [{ color: 'red' }, [{ fontSize: '12px' }, 'flex: 1']];
    // 测试嵌套数组
    const result = vStyle(input);
    expect(result).toEqual({
      color: 'red',
      fontSize: '12px',
      flex: '1',
    });
  });

  // 4. 合并与覆盖测试
  test('should override properties based on order (last wins)', () => {
    const base = { color: 'red', width: '10px' };
    const override = { color: 'blue' };

    // 数组内部覆盖
    expect(vStyle([base, override])).toEqual({ color: 'blue', width: '10px' });
  });

  test('should merge multiple arguments (target + ...merges)', () => {
    const t1 = { color: 'red' };
    const t2 = 'width: 20px';
    const t3 = { zIndex: 10 };

    // 模拟 vStyle(t1, t2, t3)
    const result = vStyle(t1, t2, t3);
    expect(result).toEqual({
      color: 'red',
      width: '20px',
      zIndex: 10,
    });
  });

  // 5. 边界情况
  test('should ignore null/undefined/false values', () => {
    const result = vStyle(
      { color: 'red' },
      null,
      undefined,
      // @ts-ignore
      false,
      { display: 'block' },
    );
    expect(result).toEqual({ color: 'red', display: 'block' });
  });
});
