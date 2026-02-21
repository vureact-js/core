import { useReactive } from '../../../../../src';

export const ReactiveBasic = () => {
  // 像 Vue 的 const state = reactive({ count: 0 })
  const state = useReactive({
    count: 0,
    name: 'Gemini',
  });

  return (
    <div className="h-example-container">
      <h3>1. 基础属性修改</h3>
      <p>姓名: {state.name}</p>
      <p>计数: {state.count}</p>

      <button onClick={() => state.count++}>直接 count++</button>
      <button onClick={() => (state.name = 'React Proxy')}>修改姓名</button>
    </div>
  );
};
