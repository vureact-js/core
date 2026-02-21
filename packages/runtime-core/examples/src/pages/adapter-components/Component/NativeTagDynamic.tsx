import { useState } from 'react';
import { Component } from '../../../../../src';

export const NativeTagDynamic = () => {
  const [tag, setTag] = useState('button');

  return (
    <div className="a-example-container">
      <h3>2. 原生标签与属性透传</h3>
      <p>切换标签类型，观察样式和行为的保留：</p>

      <div className="tabs">
        <button onClick={() => setTag('button')}>按钮 (button)</button>
        <button onClick={() => setTag('section')}>容器 (section)</button>
        <button onClick={() => setTag('a')}>链接 (a)</button>
      </div>

      <div className="component-boundary">
        {/* title, className, onClick 都会被透传给生成的标签 */}
        <Component
          is={tag}
          className="custom-element"
          title="我是透传的标题"
          href={tag === 'a' ? '#' : undefined}
          onClick={() => tag === 'button' && alert('点击了动态按钮')}
        >
          我是一个动态的 {tag} 标签
        </Component>
      </div>
    </div>
  );
};
