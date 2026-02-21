import { useReactive, useWatch } from '../../../../../src';

export const WatchAdvanced = () => {
  const state = useReactive({
    info: { name: 'Vureact', version: '1.0' },
    count: 0,
  });

  // 示例 A: 深度侦听对象
  useWatch(
    () => state.info,
    (newVal) => {
      alert(`检测到对象内部变化: ${newVal.name}`);
    },
    { deep: true },
  );

  // 示例 B: 多源侦听（侦听数组）
  useWatch([state.count, state.info.name], ([newCount, newName]) => {
    console.log('计数:', newCount, '名称', newName);
  });

  return (
    <div className="p-example-container">
      <h3>2. 深度 & 多源侦听</h3>
      <div className="card">
        <p>
          名称: {state.info.name} | 版本: {state.info.version}
        </p>
        <p>计数: {state.count}</p>

        <div className="button-group">
          <button onClick={() => (state.info.name += '!')}>修改嵌套名称</button>
          <button onClick={() => state.count++}>修改计数</button>
        </div>
      </div>
    </div>
  );
};
