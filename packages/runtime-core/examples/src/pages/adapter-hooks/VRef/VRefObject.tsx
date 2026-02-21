import { useVRef } from '../../../../../src';

export const VRefObject = () => {
  const user = useVRef({ name: 'Alice', age: 25 });

  const resetUser = () => {
    // 整体替换对象，依然保持响应式
    user.value = { name: 'Bob', age: 30 };
  };

  return (
    <div className="k-example-container">
      <h3>2. 对象 Ref (支持深层与替换)</h3>
      <div className="card">
        <p>
          当前用户: {user.value.name} ({user.value.age}岁)
        </p>
        <button onClick={() => user.value.age++}>仅修改年龄 (深层)</button>
        <button onClick={resetUser}>重置整个用户 (替换)</button>
      </div>
    </div>
  );
};
