import { Suspense } from '../../../../../src';
import { AsyncComponent } from './AsyncComponent';

export const BasicSuspense = () => {
  return (
    <div className="c-example-container">
      <h3>1. 基础 Suspense 演示</h3>
      <p>内容加载时会显示“加载中...”状态。</p>

      <Suspense fallback={<div className="loading-spinner">⏳ 正在努力加载组件...</div>}>
        <AsyncComponent name="基础示例" delay={2000} />
      </Suspense>
    </div>
  );
};
