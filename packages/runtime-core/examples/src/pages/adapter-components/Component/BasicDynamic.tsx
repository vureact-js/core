import React, { useState } from 'react';
import { Component } from '../../../../../src';

// 示例组件 A
export const ArchiveView = () => (
  <div className="dynamic-content">
    <h4>存档列表</h4>
    <ul>
      <li>2024年3月文章</li>
      <li>2024年2月文章</li>
    </ul>
  </div>
);

// 示例组件 B
export const PostView = () => (
  <div className="dynamic-content">
    <h4>文章正文</h4>
    <p>这是动态渲染的文章内容...</p>
  </div>
);

export const BasicDynamic = () => {
  const [currentTab, setCurrentTab] = useState('Post');

  // 映射关系
  const tabs: Record<string, React.FC> = {
    Post: PostView,
    Archive: ArchiveView,
  };

  return (
    <div className="a-example-container">
      <h3>1. 基础动态组件切换</h3>
      <div className="tabs">
        {Object.keys(tabs).map((name) => (
          <button
            key={name}
            onClick={() => setCurrentTab(name)}
            className={currentTab === name ? 'active' : ''}
          >
            显示 {name}
          </button>
        ))}
      </div>

      <div className="component-boundary">
        {/* 根据 currentTab 的值动态渲染对应的组件 */}
        <Component is={tabs[currentTab]} />
      </div>
    </div>
  );
};
