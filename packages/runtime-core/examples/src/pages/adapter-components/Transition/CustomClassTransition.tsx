import { useState } from 'react';
import { Transition } from '../../../../../src';

export const CustomClassTransition = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="e-example-container">
      <h3>3. 自定义 CSS 类名</h3>
      <button onClick={() => setShow(!show)}>触发强力动画</button>

      <div className="component-boundary">
        {/* 模拟集成 animate.css 的效果 */}
        <Transition
          duration={800}
          enterActiveClass="animate__animated animate__tada"
          leaveActiveClass="animate__animated animate__bounceOut"
        >
          {show ? <div className="box custom">🚀 这里的动画类名是完全自定义的</div> : null}
        </Transition>
      </div>
    </div>
  );
};
