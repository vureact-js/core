import { useShallowVRef } from '../../../../../src';

export const ShallowVRef = () => {
  const state = useShallowVRef({ count: 1 });

  return (
    <div className="k-example-container">
      <h3>3. 浅层 Ref (useShallowVRef)</h3>
      <div className="card">
        <p>数值: {state.value.count}</p>
        <p className="hint">点击修改属性不会刷新视图，除非替换整个 value</p>

        <div className="button-group">
          <button
            onClick={() => {
              state.value.count++;
              console.log('值已变但视图不跳:', state.value.count);
            }}
          >
            修改属性 (不更新)
          </button>

          <button
            onClick={() => {
              state.value = { count: state.value.count + 1 };
            }}
          >
            替换整个对象 (更新)
          </button>
        </div>
      </div>
    </div>
  );
};
