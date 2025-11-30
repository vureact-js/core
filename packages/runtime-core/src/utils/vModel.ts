interface VModelOptions {
  type?: string; // input, textarea, select, checkbox, radio, file
  modifiers?: string[]; // ['trim', 'number', 'lazy']
  prop?: string; // 组件属性名，默认 'value'
  event?: string; // 组件事件名，如 'onUpdate:value'
  multiple?: boolean; // select multiple
  value?: string; // radio 的 value 属性
}

type VModelProps = Record<string, any>;

/**
 * vModel - Runtime helper for Vue v-model directive in React JSX
 *
 * @param value - Current bound state value
 * @param setter - Callback function for updating values
 * @param options - vModel options
 * @returns Object that can be spread as JSX props
 *
 * @example
 * <input {...vModel(search, setSearch, { type: 'text', modifiers: ['trim'] })} />
 *
 * <input type="radio" value="option1" {...vModel(selected, setSelected, { type: 'radio', value: 'option1' })} />
 *
 * <MyComp {...vModel(value, setValue, { prop: 'modelValue', event: 'onUpdate_modelValue' })} />
 *
 * // {modelValue: value, onUpdate_modelValue: (v) => {setValue(e)}}
 */
export function vModel<T>(
  value: T,
  setter: (v: T) => void,
  options: VModelOptions = {},
): VModelProps {
  const {
    type = 'text',
    modifiers = [],
    prop = 'value',
    event,
    multiple,
    value: radioValue,
  } = options;

  // 判断是否为需要 onInput 的元素（text 视为 input）
  const isTextInput = type === 'input' || type === 'text';
  const isTextarea = type === 'textarea';
  const isLazy = modifiers.includes('lazy');

  // textarea 始终用 onInput；input 根据 lazy 决定
  const eventName = isTextarea || (isTextInput && !isLazy) ? 'onInput' : 'onChange';

  // 从事件对象中提取值
  const getValueFromEvent = (e: any) => {
    if (type === 'checkbox') return e.target.checked;
    if (type === 'radio') return e.target.value;
    if (type === 'file') return e.target.files;
    if (type === 'select' && multiple) {
      return Array.from(e.target.selectedOptions).map((o: any) => o.value);
    }
    return e.target.value;
  };

  // 应用修饰符
  const applyModifiers = (val: any) => {
    if (modifiers.includes('trim') && typeof val === 'string') {
      val = val.trim();
    }

    // number 修饰符：空字符串必须回退，其他按 JS 规则转换
    if (modifiers.includes('number')) {
      // Vue 核心规则：空字符串不转换，避免输入框变 0
      if (val === '') return val;

      const num = Number(val);

      // 无效字符串（非数字）回退到原始值
      // null/undefined/数字/null/undefined 都按 Number() 转换
      if (typeof val === 'string' && isNaN(num)) {
        return val;
      }

      return num; // null→0, undefined→NaN, "123"→123
    }

    return val;
  };

  // 统一的事件处理函数
  const handleChange = (e: any) => {
    const rawValue = getValueFromEvent(e);
    const newValue = applyModifiers(rawValue);
    setter(newValue);
  };

  // 自定义组件：直接传值而非事件对象
  if (event) {
    return {
      [prop]: value,
      [event]: (e: any) => {
        // 如果传的是事件对象则提取值，否则直接使用
        const rawValue = e?.target ? getValueFromEvent(e) : e;
        setter(applyModifiers(rawValue));
      },
    };
  }

  // 原生表单元素
  switch (type) {
    case 'checkbox':
      return { checked: Boolean(value), onChange: handleChange };

    case 'radio':
      return { checked: value === radioValue, onChange: handleChange };

    case 'file':
      return { onChange: handleChange }; // file input is read-only

    case 'select':
      return {
        value: multiple ? value || [] : value,
        onChange: handleChange,
      };

    default: // text, textarea, email, password, etc.
      return { [prop]: value, [eventName]: handleChange };
  }
}
