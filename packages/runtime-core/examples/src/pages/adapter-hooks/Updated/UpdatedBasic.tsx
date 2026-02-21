import { useState } from 'react';
import { useMounted, useUpdated, useVRef } from '../../../../../src';

export const UpdatedBasic = () => {
  const count = useVRef(0);
  const [messages, setMessages] = useState<string[]>([]);

  // 1. 挂载钩子：仅在初次进入时触发
  useMounted(() => {
    setMessages((prev) => [...prev, '🚀 组件已初次挂载 (onMounted)']);
  });

  // 2. 更新钩子：初次渲染时不执行，仅在 count.value 变化引起重新渲染后执行
  useUpdated(() => {
    setMessages((prev) => [...prev, `🔄 组件已完成更新，当前值为: ${count.value}`]);

    // 典型场景：更新后滚动到底部、同步第三方非 React 库、或进行 DOM 测量
    console.log('DOM 已根据最新状态完成同步');
  }, [count.value]);

  return (
    <div className="s-example-container">
      <h3>1. 仅监听更新 (onUpdated)</h3>
      <div className="card">
        <p>
          当前计数: <span className="highlight">{count.value}</span>
        </p>

        <div className="button-group">
          <button onClick={() => count.value++}>点击增加 (触发更新)</button>
          <button onClick={() => setMessages([])}>清空日志</button>
        </div>

        <div className="log-panel">
          {messages.map((msg, i) => (
            <div key={i} className="log-item">
              {msg}
            </div>
          ))}
          {messages.length === 0 && <div className="placeholder">等待交互...</div>}
        </div>
      </div>
    </div>
  );
};
