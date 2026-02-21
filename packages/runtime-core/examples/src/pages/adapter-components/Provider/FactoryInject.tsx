import { useState } from 'react';
import { useInject } from '../../../../../src';

const ExpensiveChild = ({ renderCount }: { renderCount: number }) => {
  // 工厂函数只会执行一次并被缓存，不受父组件重渲染影响
  const initTime = useInject(
    'init-timestamp',
    () => {
      console.log('执行昂贵的初始化计算...');
      return new Date().toLocaleTimeString();
    },
    true,
  );

  return (
    <div className="info-box">
      <p>父组件渲染次数: {renderCount}</p>
      <p>组件初始化时间: {initTime} (不会改变)</p>
    </div>
  );
};

export const FactoryInject = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="g-example-container">
      <h3>3. 工厂函数与缓存 (Factory)</h3>
      <button onClick={() => setCount((c) => c + 1)}>触发父组件重渲染</button>
      <ExpensiveChild renderCount={count} />
    </div>
  );
};
