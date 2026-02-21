import { useState } from 'react';
import { KeepAlive } from '../../../../../src';

const Counter = ({ name }: { name: string }) => {
  const [count, setCount] = useState(0);
  return (
    <div className="keep-alive-card">
      <h4>视图: {name}</h4>
      <p>当前计数: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>累加</button>
      <div style={{ marginTop: '10px' }}>
        <input type="text" placeholder="输入一些文字测试状态保持..." />
      </div>
    </div>
  );
};

export const BasicKeepAlive = () => {
  const [view, setView] = useState('A');

  return (
    <div className="b-example-container">
      <h3>1. 基础状态保持</h3>
      <div className="tabs">
        <button onClick={() => setView('A')} className={view === 'A' ? 'active' : ''}>
          视图 A
        </button>
        <button onClick={() => setView('B')} className={view === 'B' ? 'active' : ''}>
          视图 B
        </button>
      </div>

      <KeepAlive>
        {view === 'A' ? <Counter key="A" name="A" /> : <Counter key="B" name="B" />}
      </KeepAlive>
    </div>
  );
};
