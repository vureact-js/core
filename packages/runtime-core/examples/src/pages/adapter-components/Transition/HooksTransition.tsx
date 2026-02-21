import { useState } from 'react';
import { Transition } from '../../../../../src';

export const HooksTransition = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('已停止');

  // 模拟生命周期回调
  const handleBeforeEnter = (el: HTMLElement) => {
    setStatus('准备进入...');
    el.style.color = 'red';
  };

  const handleEnter = (el: HTMLElement, done: () => void) => {
    setStatus('正在进入...');
    el.style.transition = 'all 1s ease';
    el.style.color = '#42b883';
    // 模拟动画结束
    setTimeout(done, 1000);
  };

  const handleAfterEnter = () => {
    setStatus('进入完成 ✨');
  };

  const handleLeave = (el: HTMLElement, done: () => void) => {
    setStatus('正在离开...');
    el.style.transform = 'scale(0.5)';
    setTimeout(done, 500);
  };

  const handleAfterLeave = () => {
    setStatus('离开完成，已销毁');
  };

  return (
    <div className="e-example-container">
      <h3>4. 生命周期钩子 (JS Hooks)</h3>
      <div className="status-bar">
        当前状态: <strong>{status}</strong>
      </div>

      <button onClick={() => setShow(!show)}>切换组件</button>

      <div className="component-boundary">
        <Transition
          name="bounce"
          onBeforeEnter={handleBeforeEnter}
          onEnter={handleEnter}
          onAfterEnter={handleAfterEnter}
          onLeave={handleLeave}
          onAfterLeave={handleAfterLeave}
        >
          {show ? <div className="hook-box">使用 JS 钩子控制我</div> : null}
        </Transition>
      </div>
    </div>
  );
};
