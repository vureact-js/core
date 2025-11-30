import { vModel } from '../vModel';

describe('vModel', () => {
  let mockSetter: jest.Mock;

  beforeEach(() => {
    mockSetter = jest.fn();
  });

  describe('基础文本输入', () => {
    it('应生成 text input 的 props（默认）', () => {
      const result = vModel('test', mockSetter);
      expect(result).toEqual({
        value: 'test',
        onInput: expect.any(Function),
      });
    });

    it('应生成 textarea 的 props', () => {
      const result = vModel('text', mockSetter, { type: 'textarea' });
      expect(result).toEqual({
        value: 'text',
        onInput: expect.any(Function),
      });
    });

    it('onInput 应正确提取和设置值', () => {
      const result = vModel('', mockSetter);
      const mockEvent = { target: { value: 'new value' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith('new value');
    });
  });

  describe('.lazy 修饰符', () => {
    it('应使用 onChange 而非 onInput', () => {
      const result = vModel('test', mockSetter, {
        type: 'input',
        modifiers: ['lazy'],
      });
      expect(result).toEqual({
        value: 'test',
        onChange: expect.any(Function),
      });
      expect(result.onInput).toBeUndefined();
    });

    it('textarea 应忽略 lazy 修饰符', () => {
      const result = vModel('text', mockSetter, {
        type: 'textarea',
        modifiers: ['lazy'],
      });
      expect(result).toHaveProperty('onInput');
    });
  });

  describe('.trim 修饰符', () => {
    it('应去除字符串首尾空格', () => {
      const result = vModel('test', mockSetter, {
        modifiers: ['trim'],
      });
      const mockEvent = { target: { value: '  hello  ' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith('hello');
    });

    it('应与其他修饰符组合使用', () => {
      const result = vModel('', mockSetter, {
        modifiers: ['trim', 'number'],
      });
      const mockEvent = { target: { value: '  123  ' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(123);
    });
  });

  describe('.number 修饰符', () => {
    it('应将字符串转为数字', () => {
      const result = vModel('', mockSetter, {
        modifiers: ['number'],
      });
      const mockEvent = { target: { value: '123' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(123);
      expect(mockSetter).not.toHaveBeenCalledWith('123');
    });

    it('应保留 NaN 情况下的原始值', () => {
      const result = vModel('', mockSetter, {
        modifiers: ['number'],
      });
      const mockEvent = { target: { value: 'abc' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith('abc'); // 非数字字符串不转换
    });

    it('应正确处理 null 和 undefined', () => {
      const result = vModel('', mockSetter, {
        modifiers: ['number'],
      });

      result.onInput({ target: { value: null } });
      expect(mockSetter).toHaveBeenCalledWith(0);

      result.onInput({ target: { value: undefined } });
      expect(mockSetter).toHaveBeenCalledWith(NaN);
    });
  });

  describe('checkbox 类型', () => {
    it('应绑定 checked 而非 value', () => {
      const result = vModel(true, mockSetter, { type: 'checkbox' });
      expect(result).toEqual({
        checked: true,
        onChange: expect.any(Function),
      });
    });

    it('onChange 应提取 checked 状态', () => {
      const result = vModel(false, mockSetter, { type: 'checkbox' });
      const mockEvent = { target: { checked: true } };

      result.onChange(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(true);
    });

    it('应正确转换非布尔值为布尔值', () => {
      const result = vModel('yes' as any, mockSetter, { type: 'checkbox' });
      expect(result.checked).toBe(true);

      const result2 = vModel(0 as any, mockSetter, { type: 'checkbox' });
      expect(result2.checked).toBe(false);
    });
  });

  describe('radio 类型', () => {
    it('应绑定 checked 并比较 radioValue', () => {
      const result = vModel('option1', mockSetter, {
        type: 'radio',
        value: 'option1',
      });
      expect(result).toEqual({
        checked: true,
        onChange: expect.any(Function),
      });
    });

    it('当 value 不匹配时应为 unchecked', () => {
      const result = vModel('option1', mockSetter, {
        type: 'radio',
        value: 'option2',
      });
      expect(result.checked).toBe(false);
    });

    it('onChange 应返回 target.value', () => {
      const result = vModel('', mockSetter, { type: 'radio', value: 'opt' });
      const mockEvent = { target: { value: 'selectedValue' } };

      result.onChange(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith('selectedValue');
    });
  });

  describe('file 类型', () => {
    it('应只提供 onChange（file input 只读）', () => {
      const result = vModel(null, mockSetter, { type: 'file' });
      expect(result).toEqual({
        onChange: expect.any(Function),
      });
      expect(result.value).toBeUndefined();
    });

    it('onChange 应返回 files 对象', () => {
      const result = vModel(null, mockSetter, { type: 'file' });
      const mockFiles = [{ name: 'test.txt' }];
      const mockEvent = { target: { files: mockFiles } };

      result.onChange(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(mockFiles);
    });
  });

  describe('select 类型', () => {
    it('应支持单选模式', () => {
      const result = vModel('option1', mockSetter, { type: 'select' });
      expect(result).toEqual({
        value: 'option1',
        onChange: expect.any(Function),
      });
    });

    it('应支持多选模式', () => {
      const result = vModel(['opt1', 'opt2'], mockSetter, {
        type: 'select',
        multiple: true,
      });
      expect(result).toEqual({
        value: ['opt1', 'opt2'],
        onChange: expect.any(Function),
      });
    });

    it('多选模式 onChange 应返回选中值数组', () => {
      const result = vModel([], mockSetter, {
        type: 'select',
        multiple: true,
      });
      const mockEvent = {
        target: {
          selectedOptions: [{ value: 'opt1' }, { value: 'opt2' }],
        },
      };

      result.onChange(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(['opt1', 'opt2']);
    });

    it('多选模式 value 为空时应默认为空数组', () => {
      const result = vModel(null, mockSetter, {
        type: 'select',
        multiple: true,
      });
      expect(result.value).toEqual([]);
    });
  });

  describe('自定义组件', () => {
    it('应使用指定的 prop 和 event', () => {
      const result = vModel('modelValue', mockSetter, {
        prop: 'modelValue',
        event: 'onUpdate_modelValue',
      });
      expect(result).toEqual({
        modelValue: 'modelValue',
        onUpdate_modelValue: expect.any(Function),
      });
    });

    it('自定义 event 应正确调用 setter', () => {
      const result = vModel('value', mockSetter, {
        prop: 'modelValue',
        event: 'onUpdate_modelValue',
      });

      // 模拟原生事件对象
      result.onUpdate_modelValue({ target: { value: 'new value' } });
      expect(mockSetter).toHaveBeenCalledWith('new value');
    });

    // 或测试直接传值场景（更贴近自定义组件实际用法）
    it('应支持自定义组件直接传值', () => {
      const result = vModel('value', mockSetter, {
        prop: 'modelValue',
        event: 'onUpdate_modelValue',
      });

      result.onUpdate_modelValue('direct value'); // 直接传值
      expect(mockSetter).toHaveBeenCalledWith('direct value');
    });
  });

  describe('参数传递完整性', () => {
    it('应正确传递事件对象', () => {
      const result = vModel('', mockSetter);
      const mockEvent = { target: { value: 'test' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith('test');
    });

    it('自定义 setter 应接收正确值', () => {
      const customSetter = jest.fn((val: string) => {
        expect(val).toBe('transformed');
      });

      const result = vModel('', customSetter, { modifiers: ['trim'] });
      result.onInput({ target: { value: ' transformed ' } });

      expect(customSetter).toHaveBeenCalledWith('transformed');
    });
  });

  describe('默认值和边界情况', () => {
    it('应使用默认 type="text"', () => {
      const result = vModel('', mockSetter, {});
      expect(result).toHaveProperty('onInput');
    });

    it('应使用默认 prop="value"', () => {
      const result = vModel('test', mockSetter);
      expect(result).toHaveProperty('value');
    });

    it('应处理空 modifiers 数组', () => {
      const result = vModel('', mockSetter, { modifiers: [] });
      const mockEvent = { target: { value: 'test' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith('test');
    });

    it('应处理 undefined options', () => {
      const result = vModel('', mockSetter, undefined);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('onInput');
    });

    it('应处理 null value', () => {
      const result = vModel(null, mockSetter, { type: 'text' });
      expect(result.value).toBe(null);
    });

    it('应处理 undefined value', () => {
      const result = vModel(undefined, mockSetter, { type: 'text' });
      expect(result.value).toBeUndefined();
    });
  });

  describe('修饰符组合', () => {
    it('应同时应用 trim 和 number', () => {
      const result = vModel('', mockSetter, {
        modifiers: ['trim', 'number'],
      });
      const mockEvent = { target: { value: '  456  ' } };

      result.onInput(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(456);
    });

    it('lazy + number 应正常转换', () => {
      const result = vModel('', mockSetter, {
        type: 'input',
        modifiers: ['lazy', 'number'],
      });
      const mockEvent = { target: { value: '789' } };

      result.onChange(mockEvent);
      expect(mockSetter).toHaveBeenCalledWith(789);
    });
  });
});
