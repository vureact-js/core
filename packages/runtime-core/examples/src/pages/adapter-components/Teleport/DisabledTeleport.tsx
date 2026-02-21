import { useState } from 'react';
import { Teleport } from '../../../../../src';

export function DisabledTeleport() {
  const [isMobile, setIsMobile] = useState(false);

  return (
    <div className="d-example-container">
      <h3>带禁用属性的 Teleport</h3>
      <label>
        <input type="checkbox" checked={isMobile} onChange={(e) => setIsMobile(e.target.checked)} />
        禁用（模拟移动端）
      </label>

      <div className="parent-box" style={{ border: '2px dashed #ccc', padding: '10px' }}>
        <p>父容器</p>

        <Teleport to="body" disabled={isMobile}>
          <div className="status-badge" style={{ color: 'red', fontWeight: 'bold' }}>
            {isMobile ? '我将原地渲染”' : '我被传送至 Body'}
          </div>
        </Teleport>
      </div>
    </div>
  );
}
