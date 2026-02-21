import { useRef, useState } from 'react';
import { useVRef, useWatchPostEffect } from '../../../../../src';

export const WatchEffectFlush = () => {
  const count = useVRef(0);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [domWidth, setDomWidth] = useState(0);

  // useWatchPostEffect 确保在 React 完成 DOM 更新后执行
  // 这对于需要操作真实 DOM 节点的场景（如获取尺寸）非常重要
  useWatchPostEffect(() => {
    if (textRef.current) {
      setDomWidth(textRef.current.offsetWidth);
    }
  }, [count.value]);

  return (
    <div className="q-example-container">
      <h3>2. Post 刷新 (DOM 操作)</h3>
      <div className="card">
        <p ref={textRef} style={{ display: 'inline-block', padding: '5px', background: '#e2e8f0' }}>
          测试文本的内容: {count.value}
        </p>
        <p>
          上次测量宽度: <span className="highlight">{domWidth}px</span>
        </p>

        <div className="button-group">
          <button onClick={() => (count.value = Math.random() * 10000)}>更新内容</button>
        </div>
      </div>
    </div>
  );
};
