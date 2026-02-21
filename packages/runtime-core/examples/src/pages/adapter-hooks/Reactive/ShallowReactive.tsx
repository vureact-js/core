import { useShallowReactive } from '../../../../../src';

export const ShallowReactive = () => {
  const state = useShallowReactive({
    count: 0,
    nested: { val: 100 },
  });

  return (
    <div className="h-example-container">
      <h3>3. 浅层响应式</h3>
      <p>第一层 Count: {state.count}</p>
      <p>深层 Nested: {state.nested.val}</p>

      <button onClick={() => state.count++}>修改第一层 (触发更新)</button>
      <button
        onClick={() => {
          // 修改深层属性，由于是 shallow，视图不会主动重渲染
          state.nested.val++;
          console.log('当前值已变但未更新视图:', state.nested.val);
        }}
      >
        修改深层 (不触发更新)
      </button>
    </div>
  );
};
