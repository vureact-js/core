import { useState } from 'react';
import { KeepAlive, useActived, useDeactivated } from '../../../../../src';

const LogComponent = ({ name, show }: { name: string; show: boolean }) => {
  const [msgs, setMsgs] = useState<string[]>([]);

  useActived(() => {
    setMsgs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 🚀 进入视图`]);
  });

  useDeactivated(() => {
    setMsgs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 🚶🏻‍♂️进入后台缓存`]);
  });

  return (
    <div className="keep-alive-card">
      <h4>组件: {name}</h4>
      {show ? (
        <div className="log-window">
          {msgs.map((m, i) => (
            <div key={i}>{m}</div>
          ))}
        </div>
      ) : (
        '已关闭面板'
      )}
    </div>
  );
};

export const LifecycleKeepAlive = () => {
  const [show, setShow] = useState(true);

  return (
    <div className="example-container">
      <h3>2. 生命周期钩子演示</h3>
      <p>切换“显示/隐藏”来触发激活与停用钩子：</p>
      <button onClick={() => setShow(!show)}>{show ? '切出缓存' : '切回显示'}</button>
      {/* 
         ❌错误写法：使用 null 或空节点
         <KeepAlive>{show && <LogComponent key="logger" name="日志监控" />}</KeepAlive>
         <KeepAlive>{show ? <LogComponent key="logger" name="日志监控" /> : null}</KeepAlive>
      */}
      <KeepAlive>
        {show ? (
          <LogComponent show key="logger" name="日志监控" />
        ) : (
          <LogComponent show={false} key="logger2" name="日志监控" />
        )}
      </KeepAlive>
    </div>
  );
};
