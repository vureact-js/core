import { useState } from 'react';
import { useVRef, useWatch } from '../../../../../src';

export const WatchBasic = () => {
  const userId = useVRef(1);
  const [userData, setUserData] = useState<string>('Empty');
  const [loading, setLoading] = useState(false);

  // 侦听 userId 的变化
  useWatch(
    userId, // 可不传递带 .value，自动解包
    async (newId, oldId, onCleanup) => {
      let isCancelled = false;

      // 注册清理函数：当 userId 再次变化或组件卸载时执行
      onCleanup?.(() => {
        isCancelled = true;
      });

      setLoading(true);
      console.log(`用户 ID 从 ${oldId} 变为 ${newId}，正在获取数据...`);

      // 模拟异步请求
      const data = await new Promise((resolve) =>
        setTimeout(() => resolve(`User Data For ${newId}`), 1000),
      );

      if (!isCancelled) {
        setUserData(data as string);
        setLoading(false);
      }
    },
    { immediate: true },
  ); // immediate: true 确保组件挂载时立即执行一次

  return (
    <div className="p-example-container">
      <h3>1. 基础侦听 (Async & Cleanup)</h3>
      <div className="card">
        <p>
          当前用户 ID: <span className="highlight">{userId.value}</span>
        </p>
        <p>数据状态: {loading ? '加载中...' : userData}</p>

        <div className="button-group">
          <button onClick={() => userId.value++}>切换下一个用户</button>
        </div>
      </div>
    </div>
  );
};
