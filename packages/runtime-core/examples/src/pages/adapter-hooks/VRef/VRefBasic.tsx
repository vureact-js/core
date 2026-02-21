import { useVRef } from '../../../../../src';

export const VRefBasic = () => {
  // 对应 Vue 的 const count = ref(0)
  const count = useVRef(0);
  const name = useVRef('React');

  return (
    <div className="k-example-container">
      <h3>1. 基础类型 Ref</h3>
      <div className="card">
        <p>
          计数器: <span className="highlight">{count.value}</span>
        </p>
        <p>
          姓名: <span className="highlight">{name.value}</span>
        </p>

        <div className="button-group">
          <button onClick={() => count.value++}>自增</button>
          <button onClick={() => (name.value = `Vureact ${count.value}`)}>改名</button>
        </div>
      </div>
    </div>
  );
};
