import React, { useState } from 'react';
import { Component, KeepAlive } from '../../../../../src';

export const InputView = () => (
  <div className="dynamic-content">
    <p>输入一些内容，切换后会保留：</p>
    <input type="text" placeholder="输入测试..." />
  </div>
);

export const CounterView = () => {
  const [count, setCount] = useState(0);
  return (
    <div className="dynamic-content">
      <p>当前计数: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>累加</button>
    </div>
  );
};

export const KeepAliveDynamic = () => {
  const [tab, setTab] = useState('Input');

  const components: Record<string, React.FC> = {
    Input: InputView,
    Counter: CounterView,
  };

  return (
    <div className="a-example-container">
      <h3>3. 动态组件 + KeepAlive</h3>
      <div className="tabs">
        <button onClick={() => setTab('Input')} className={tab === 'Input' ? 'active' : ''}>
          输入组件
        </button>
        <button onClick={() => setTab('Counter')} className={tab === 'Counter' ? 'active' : ''}>
          计数组件
        </button>
      </div>

      <KeepAlive>
        {/* 注意：配合 KeepAlive 使用时，通常需要 key 来辅助识别唯一性 */}
        <Component is={components[tab]} key={tab} />
      </KeepAlive>
    </div>
  );
};
