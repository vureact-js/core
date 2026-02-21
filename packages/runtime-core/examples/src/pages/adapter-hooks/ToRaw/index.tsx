import { useState } from 'react';
import { useReactive, useToRaw } from '../../../../../src';
import './style.css';

export const ToRawBasic = () => {
  const state = useReactive({
    settings: {
      theme: 'dark',
      notifications: true,
    },
  });

  const [rawSnapshot, setRawSnapshot] = useState<string>('');

  const handleGetRaw = () => {
    // 获取原始对象
    const rawData = useToRaw(state);

    // 证明它不再具有响应性：
    // 修改 rawData.settings.theme = 'light' 不会引起页面重绘

    setRawSnapshot(JSON.stringify(rawData, null, 2));
    console.log('原始数据对象:', rawData);
  };

  return (
    <div className="m-example-container">
      <h3>3. useToRaw 示例</h3>
      <div className="card">
        <p>
          当前主题: <span className="highlight">{state.settings.theme}</span>
        </p>

        <div className="button-group">
          <button
            onClick={() =>
              (state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark')
            }
          >
            切换响应式主题
          </button>
          <button onClick={handleGetRaw}>获取原始快照</button>
        </div>

        {rawSnapshot && (
          <div style={{ marginTop: '15px' }}>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Raw Data (非响应式):</p>
            <pre
              style={{
                fontSize: '12px',
                background: '#f1f5f9',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {rawSnapshot}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
