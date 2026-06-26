import { memo } from 'react';
import { useVRef, useComputed } from '@vureact/runtime-core';
import './input-21c4253e.css';
const Input = memo(() => {
  // 示例 1
  const showTitle = useVRef(true);

  // 示例 2
  const isLoggedIn = useVRef(false);

  // 示例 3
  const type = useVRef('B');

  // 示例 4
  const hasPermission = useVRef(true);

  // 示例 5：复杂条件
  const userLevel = useVRef('free');
  const isVIP = useComputed(() => userLevel.value === 'vip');
  const isPremium = useComputed(() => userLevel.value === 'premium');

  // 示例 6：嵌套条件
  const status = useVRef('success');
  const errorMessage = useVRef('');
  const items = useVRef(['苹果', '香蕉', '橘子']);
  function retry() {
    status.value = 'loading';
    // 模拟重新请求
    setTimeout(() => {
      status.value = 'success';
      items.value = ['苹果', '香蕉', '橘子', '葡萄'];
    }, 1000);
  }

// 示例 7：可选链 ?.
const data = useVRef(null);
// 模拟异步获取数据
setTimeout(() => {
  data.value = {
    list: [
      {
        name: '张三',
      },
      {
        name: null,
      },
      {
        name: '李四',
      },
    ],
  };
}, 2000);

  // 示例 8：深层嵌套可选链
  const user = useVRef({
    name: 'Alice',
    profile: {
      address: {
        city: '北京',
        country: '中国',
      },
    },
  });
  return (
    <>
      {/* ==================== 示例 1：基本 v-if ==================== */}
      {showTitle.value ? <h1 data-css-21c4253e>Hello Vue</h1> : null}
      {/* ==================== 示例 2：v-if / v-else ==================== */}
      {isLoggedIn.value ? (
        <p data-css-21c4253e>欢迎回来，用户！</p>
      ) : (
        <p data-css-21c4253e>请先登录。</p>
      )}
      {/* ==================== 示例 3：v-if / v-else-if / v-else ==================== */}
      {type.value === 'A' ? (
        <div data-css-21c4253e>类型 A</div>
      ) : type.value === 'B' ? (
        <div data-css-21c4253e>类型 B</div>
      ) : type.value === 'C' ? (
        <div data-css-21c4253e>类型 C</div>
      ) : (
        <div data-css-21c4253e>未知类型</div>
      )}
      {/* ==================== 示例 4：在 template 上使用 v-if 分组 ==================== */}
      {hasPermission.value ? (
        <>
          <h2 data-css-21c4253e>管理员面板</h2>
          <p data-css-21c4253e>你拥有管理员权限。</p>
          <button data-css-21c4253e>管理用户</button>
        </>
      ) : (
        <>
          <h2 data-css-21c4253e>普通用户面板</h2>
          <p data-css-21c4253e>功能受限。</p>
        </>
      )}
      {/* ==================== 示例 5：复杂条件（结合 computed） ==================== */}
      <section data-css-21c4253e>
        {isVIP.value ? (
          <div data-css-21c4253e>
            <span data-css-21c4253e>🌟 VIP 会员专享内容</span>
            <ul data-css-21c4253e>
              <li data-css-21c4253e>高级主题</li>
              <li data-css-21c4253e>专属客服</li>
            </ul>
          </div>
        ) : isPremium.value ? (
          <div data-css-21c4253e>
            <span data-css-21c4253e>💎 高级会员</span>
          </div>
        ) : (
          <div data-css-21c4253e>
            <span data-css-21c4253e>🔓 免费用户</span>
            <a href="/upgrade" data-css-21c4253e>
              升级会员
            </a>
          </div>
        )}
      </section>
      {/* ==================== 示例 6：嵌套条件 ==================== */}
      {status.value === 'loading' ? (
        <div data-css-21c4253e>
          <span data-css-21c4253e>⏳ 加载中…</span>
        </div>
      ) : status.value === 'error' ? (
        <div data-css-21c4253e>
          <span data-css-21c4253e>❌ 加载失败：{errorMessage.value}</span>
          <button onClick={retry} data-css-21c4253e>
            重试
          </button>
        </div>
      ) : (
        <div data-css-21c4253e>
          {items.value.length === 0 ? (
            <div data-css-21c4253e>
              <span data-css-21c4253e>📭 暂无数据</span>
            </div>
          ) : (
            <div data-css-21c4253e>
              <ul data-css-21c4253e>
                {items.value.map((item, index) => (
                  <li key={index} data-css-21c4253e>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {/* ==================== 示例 7：可选链操作符 ?. 安全访问 ==================== */}
      {data.value?.list ? (
        <div data-css-21c4253e>
          <p data-css-21c4253e>data.list 存在且非空，长度为：{data.value.list.length}</p>
          <ul data-css-21c4253e>
            {data.value.list.map((item, i) => (
              <li key={i} data-css-21c4253e>
                {item?.name ?? '未命名'}
              </li>
            ))}
          </ul>
        </div>
      ) : data.value?.list === undefined ? (
        <div data-css-21c4253e>
          <p data-css-21c4253e>data 或 data.list 为 undefined（安全访问避免报错）</p>
        </div>
      ) : (
        <div data-css-21c4253e>
          <p data-css-21c4253e>data.list 存在但为空数组</p>
        </div>
      )}
      {/* ==================== 示例 8：更深层嵌套的可选链 ==================== */}
      {user.value?.profile?.address?.city ? (
        <article data-css-21c4253e>
          <h3 data-css-21c4253e>{user.value?.name}的城市</h3>
          <p data-css-21c4253e>
            {user.value?.profile?.address?.city}，{user.value?.profile?.address?.country}
          </p>
        </article>
      ) : (
        <article data-css-21c4253e>
          <h3 data-css-21c4253e>{user.value?.name ?? '未知用户'}</h3>
          <p data-css-21c4253e>地址信息不完整</p>
        </article>
      )}
    </>
  );
});
export default Input;
