import { useState } from 'react';
import { Teleport } from '../../../../../src';

export function BasicTeleport() {
  const [open, setOpen] = useState(false);

  return (
    <div className="d-example-container">
      <h3>Teleport 基础示例</h3>
      <p>模态框嵌套在此 div 内，但会被渲染到 body 中。</p>

      <button onClick={() => setOpen(true)}>打开</button>

      <Teleport to="body">
        {open && (
          <div className="modal">
            <p>我被渲染在 body 内的底部。</p>
            <button onClick={() => setOpen(false)}>关闭</button>
          </div>
        )}
      </Teleport>
    </div>
  );
}
