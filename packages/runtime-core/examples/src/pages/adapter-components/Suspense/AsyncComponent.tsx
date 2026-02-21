import React from 'react';

// 模拟一个需要加载时间的异步组件
export const AsyncComponent = React.lazy(
  () =>
    new Promise<{ default: React.FC<{ name: string; delay: number }> }>((resolve) => {
      // 动态通过传参模拟不同延迟
      const delay = 2000;
      setTimeout(() => {
        resolve({
          default: ({ name }) => (
            <div className="async-card">
              <h4>✅ 组件加载成功: {name}</h4>
              <p>这是一个异步加载的 React 组件，模拟了 Vue 的异步依赖。</p>
            </div>
          ),
        });
      }, delay);
    }),
);
