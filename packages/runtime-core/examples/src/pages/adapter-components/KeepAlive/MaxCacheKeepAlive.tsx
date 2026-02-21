import { useState } from 'react';
import { KeepAlive } from '../../../../../src';

const CacheItem = ({ id }: { id: string }) => {
  // 组件初始化时记录时间，用于观察是否是重新创建的
  const [initTime] = useState(new Date().toLocaleTimeString());

  return (
    <div className="keep-alive-card">
      <h4>组件 ID: {id}</h4>
      <p>初次挂载时间: {initTime}</p>
      <input type="text" placeholder={`给 ${id} 留点言...`} />
    </div>
  );
};

export const MaxCacheKeepAlive = () => {
  const [activeId, setActiveId] = useState('1');

  return (
    <div className="example-container">
      <h3>3. 最大缓存限制 (max="2")</h3>
      <p>如果依次访问 1, 2, 3，那么 1 将会被销毁（因为 LRU 算法）。</p>

      <div className="tabs">
        {['1', '2', '3'].map((id) => (
          <button
            key={id}
            onClick={() => setActiveId(id)}
            className={activeId === id ? 'active' : ''}
          >
            显示组件 {id}
          </button>
        ))}
      </div>

      <KeepAlive max={2}>
        <CacheItem key={activeId} id={activeId} />
      </KeepAlive>
    </div>
  );
};
