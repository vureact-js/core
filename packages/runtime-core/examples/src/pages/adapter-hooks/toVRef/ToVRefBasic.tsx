import { useReactive, useToVRef } from '../../../../../src';

export const ToVRefBasic = () => {
  const state = useReactive({
    count: 1,
    user: { name: 'Gemini' },
  });

  // 即使 state.count 只是个数字，通过 useToVRef 提取后会变成一个 Ref 对象 { value: number }
  const countRef = useToVRef(state, 'count');

  return (
    <div className="m-example-container">
      <h3>1. useToVRef 示例</h3>
      <div className="card">
        <p>源对象 State: {state.count}</p>
        <p className="highlight">提取出的 Ref: {countRef.value}</p>

        <div className="button-group">
          {/* 修改 Ref 会自动同步回源对象 */}
          <button onClick={() => countRef.value++}>通过 Ref 增加</button>
          <button onClick={() => state.count--}>通过源对象减少</button>
        </div>
      </div>
    </div>
  );
};
