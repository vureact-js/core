import { useState } from 'react';
import { Transition } from '../../../../../src';

export const BasicTransition = () => {
  const [show, setShow] = useState(true);

  return (
    <div className="e-example-container">
      <h3>1. 基础显隐过渡</h3>
      <button onClick={() => setShow(!show)}>{show ? '隐藏' : '显示'}内容</button>

      <div className="component-boundary">
        {/* name="fade" 会自动应用 fade-enter, fade-enter-active 等类名 */}
        <Transition name="fade">{show ? <div className="box">Box</div> : null}</Transition>
      </div>
    </div>
  );
};
