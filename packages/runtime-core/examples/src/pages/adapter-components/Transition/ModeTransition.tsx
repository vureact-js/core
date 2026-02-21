import { useState } from 'react';
import { Transition } from '../../../../../src';

export const ModeTransition = () => {
  const [state, setState] = useState(true);

  return (
    <div className="e-example-container">
      <h3>2. 过渡模式 (mode="out-in")</h3>
      <p>点击按钮切换状态，观察平滑的“先出后进”效果：</p>

      <div className="tabs">
        <button onClick={() => setState(!state)} className={state ? 'active' : ''}>
          {state ? '隐藏' : '显示'}
        </button>
      </div>

      <div className="component-boundary">
        {/* 使用 mode="out-in" 解决切换时的占位问题 */}
        <Transition name="slide-fade" duration={{ enter: 300, leave: 800 }}>
          {state ? (
            <button key="on" className="v-btn on">
              显示状态
            </button>
          ) : (
            <button key="off" className="v-btn off">
              隐藏状态
            </button>
          )}
        </Transition>
      </div>
    </div>
  );
};
