import { useReactive, useReadonly } from '../../../../../src';

export const ReadonlyBasic = () => {
  const original = useReactive({
    count: 0,
    nested: { text: 'Hello' },
  });

  // 创建只读副本
  const readonlyCopy = useReadonly(original);

  const attemptUpdate = () => {
    // 这里的赋值在开发模式下会触发警告，且不会生效
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (readonlyCopy as any).count++;
    console.log('尝试修改只读对象，当前值:', readonlyCopy.count);
  };

  return (
    <div className="l-example-container">
      <h3>1. 深度只读副本</h3>
      <div className="card">
        <p>
          源对象: {original.count} | {original.nested.text}
        </p>
        <p className="highlight">
          只读副本: {readonlyCopy.count} | {readonlyCopy.nested.text}
        </p>

        <div className="button-group">
          <button onClick={() => original.count++}>修改源对象 (有效)</button>
          <button onClick={attemptUpdate} className="error-btn">
            直接修改只读副本 (无效)
          </button>
        </div>
      </div>
    </div>
  );
};
