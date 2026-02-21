import { useState } from 'react';
import { Provider, useInject } from '../../../../../src';

// 孙子组件：直接通过名称注入数据
const DeepChild = () => {
  const theme = useInject<string>('app-theme');
  return (
    <div className={`info-box theme-${theme}`}>
      当前接收到的主题是: <strong>{theme}</strong>
    </div>
  );
};

export const BasicProvider = () => {
  const [theme, setTheme] = useState('light');

  return (
    <div className="g-example-container">
      <h3>1. 基础 Provide / Inject</h3>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>切换主题</button>

      {/* 顶层提供数据 */}
      <Provider name="app-theme" value={theme}>
        <div className="wrapper-box">
          <p>我是中间层组件，我不关心 theme 数据...</p>
          <DeepChild />
        </div>
      </Provider>
    </div>
  );
};
