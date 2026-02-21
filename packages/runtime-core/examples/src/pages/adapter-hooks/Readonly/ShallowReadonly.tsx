/* eslint-disable @typescript-eslint/no-explicit-any */
import { useReactive, useShallowReadonly } from '../../../../../src';

export const ShallowReadonly = () => {
  const state = useReactive({
    user: { name: 'React', role: 'Admin' },
  });

  const shallowRead = useShallowReadonly(state);

  return (
    <div className="l-example-container">
      <h3>2. 浅层只读</h3>
      <div className="card">
        <p>用户名: {shallowRead.user.name}</p>
        <div className="button-group">
          <button
            onClick={() => {
              // 第一层禁止修改
              (shallowRead as any).user = { name: 'New' };
            }}
          >
            修改第一层 (无效)
          </button>

          <button
            onClick={() => {
              // 深层属性在 shallowReadonly 中由于引用了源 Proxy，依然可写
              (shallowRead.user as any).name = 'Vureact';
            }}
          >
            修改深层属性 (有效)
          </button>
        </div>
      </div>
    </div>
  );
};
