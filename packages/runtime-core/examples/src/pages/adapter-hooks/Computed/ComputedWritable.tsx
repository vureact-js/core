import { useComputed, useReactive } from '../../../../../src';

export const ComputedWritable = () => {
  const state = useReactive({
    firstName: '张',
    lastName: '三',
  });

  // 定义可读写的计算属性
  const fullName = useComputed({
    get: () => `${state.firstName} ${state.lastName}`,
    set: (val: string) => {
      const [first, last] = val.split(' ');
      state.firstName = first || '';
      state.lastName = last || '';
    },
  });

  return (
    <div className="i-example-container">
      <h3>2. 可读写计算属性</h3>
      <div className="card">
        <p>
          姓: <input value={state.firstName} onChange={(e) => (state.firstName = e.target.value)} />
        </p>
        <p>
          名: <input value={state.lastName} onChange={(e) => (state.lastName = e.target.value)} />
        </p>

        <hr />

        <p>全名 (通过 Computed 修改):</p>
        <input
          value={fullName.value}
          onChange={(e) => (fullName.value = e.target.value)}
          placeholder="输入 全名 以同步修改 姓/名"
        />
        <p className="hint">尝试输入 "李 四" 看看</p>
      </div>
    </div>
  );
};
