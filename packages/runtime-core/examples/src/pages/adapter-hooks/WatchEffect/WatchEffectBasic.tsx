import { useState } from 'react';
import { useVRef, useWatchEffect } from '../../../../../src';

export const WatchEffectBasic = () => {
  const count = useVRef(0);
  const [log, setLog] = useState<string[]>([]);

  // 1. 自动侦听：组件挂载时立即执行，并在 count.value 变化时再次执行
  const stop = useWatchEffect(
    (onCleanup) => {
      const message = `当前计数是: ${count.value}`;
      setLog((prev) => [...prev, message]);

      onCleanup?.(() => {
        console.log('执行清理逻辑...');
      });
    },
    [count.value],
  );

  return (
    <div className="q-example-container">
      <h3>1. 自动侦听与停止</h3>
      <div className="card">
        <p className="highlight">Count: {count.value}</p>

        <div className="button-group">
          <button onClick={() => count.value++}>增加计数</button>
          <button onClick={() => stop()}>停止侦听 (Stop)</button>
        </div>

        <div className="log-panel">
          {log.map((item, i) => (
            <div key={i}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
