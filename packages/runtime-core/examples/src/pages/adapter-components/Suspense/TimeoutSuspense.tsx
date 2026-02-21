import { useState } from 'react';
import { Suspense } from '../../../../../src';
import { AsyncComponent } from './AsyncComponent';

export const TimeoutSuspense = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  return (
    <div className="c-example-container">
      <h3>2. 带有延迟阈值的 Suspense</h3>
      <p>设置 timeout=1000：如果组件在 1s 内加载完，则不会出现闪烁的加载状态。</p>

      <Suspense
        timeout={1000}
        fallback={<div className="loading-spinner">⏳ 超过 1 秒未完成，显示加载中...</div>}
        onPending={() => addLog('开始加载 (Pending)')}
        onFallback={() => addLog('触发 Fallback (已超时)')}
        onResolve={() => addLog('完成加载 (Resolve)')}
      >
        <AsyncComponent name="延迟阈值示例" delay={2500} />
      </Suspense>

      <div className="log-panel">
        <strong>生命周期日志:</strong>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};
