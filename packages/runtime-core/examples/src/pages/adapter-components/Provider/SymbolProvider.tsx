import { useState } from 'react';
import { Provider, useInject } from '../../../../../src';

// 导出 Symbol 供其他文件引入使用
export const UserStateKey = Symbol('UserState');

const ProfileEditor = () => {
  // 注入时，类型安全地解构出状态和修改器
  const user = useInject<{ name: string; setName: (v: string) => void }>(UserStateKey);

  if (!user) return null;

  return (
    <div className="info-box">
      <p>当前用户: {user.name}</p>
      <input
        value={user.name}
        onChange={(e) => user.setName(e.target.value)}
        placeholder="修改名字..."
      />
    </div>
  );
};

export const SymbolProvider = () => {
  const [name, setName] = useState('React 开发者');

  // 将状态和 updater 组合成一个对象传递
  const userContextValue = { name, setName };

  return (
    <div className="g-example-container">
      <h3>4. 使用 Symbol 传递复杂状态</h3>

      <Provider name={UserStateKey} value={userContextValue}>
        <ProfileEditor />
      </Provider>
    </div>
  );
};
