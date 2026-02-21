import { Suspense } from '../../../../../src';
import { AsyncComponent } from './AsyncComponent';

export const NestedSuspense = () => {
  return (
    <div className="c-example-container">
      <h3>3. 嵌套异步依赖</h3>
      <p>Suspense 会等待内部所有的异步组件都准备就绪后才一次性展示。</p>

      <Suspense fallback={<div className="loading-spinner">⏳ 正在同步多个异步组件...</div>}>
        <div className="grid">
          <AsyncComponent name="组件 A" delay={1500} />
          <AsyncComponent name="组件 B" delay={3000} />
        </div>
      </Suspense>
    </div>
  );
};
