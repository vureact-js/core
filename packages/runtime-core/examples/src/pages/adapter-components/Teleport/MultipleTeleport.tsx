import { Teleport } from '../../../../../src';

export function MultipleTeleport() {
  // 模拟官网在目标元素中追加内容
  return (
    <div className="d-example-container">
      <h3>多个传送（Teleport）</h3>
      <p>Two different teleports targeting the same #modals element.</p>

      {/* 预设的目标容器 */}
      <div id="modals" style={{ background: '#f0f0f0', padding: '10px' }}>
        <strong>#modals 容器：</strong>
      </div>

      <hr />

      <Teleport to="#modals">
        <div style={{ color: 'blue' }}>A：来自组件 A 的传送</div>
      </Teleport>

      <Teleport to="#modals">
        <div style={{ color: 'green' }}>B：来自组件 B 的传送</div>
      </Teleport>
    </div>
  );
}
