<template>
  <!-- ==================== 示例 1：基本 v-if ==================== -->
  <h1 v-if="showTitle">Hello Vue</h1>

  <!-- ==================== 示例 2：v-if / v-else ==================== -->
  <p v-if="isLoggedIn">欢迎回来，用户！</p>
  <p v-else>请先登录。</p>

  <!-- ==================== 示例 3：v-if / v-else-if / v-else ==================== -->
  <div v-if="type === 'A'">类型 A</div>
  <div v-else-if="type === 'B'">类型 B</div>
  <div v-else-if="type === 'C'">类型 C</div>
  <div v-else>未知类型</div>

  <!-- ==================== 示例 4：在 template 上使用 v-if 分组 ==================== -->
  <template v-if="hasPermission">
    <h2>管理员面板</h2>
    <p>你拥有管理员权限。</p>
    <button>管理用户</button>
  </template>
  <template v-else>
    <h2>普通用户面板</h2>
    <p>功能受限。</p>
  </template>

  <!-- ==================== 示例 5：复杂条件（结合 computed） ==================== -->
  <section>
    <div v-if="isVIP">
      <span>🌟 VIP 会员专享内容</span>
      <ul>
        <li>高级主题</li>
        <li>专属客服</li>
      </ul>
    </div>
    <div v-else-if="isPremium">
      <span>💎 高级会员</span>
    </div>
    <div v-else>
      <span>🔓 免费用户</span>
      <a href="/upgrade">升级会员</a>
    </div>
  </section>

  <!-- ==================== 示例 6：嵌套条件 ==================== -->
  <div v-if="status === 'loading'">
    <span>⏳ 加载中…</span>
  </div>
  <div v-else-if="status === 'error'">
    <span>❌ 加载失败：{{ errorMessage }}</span>
    <button @click="retry">重试</button>
  </div>
  <div v-else>
    <div v-if="items.length === 0">
      <span>📭 暂无数据</span>
    </div>
    <div v-else>
      <ul>
        <li v-for="(item, index) in items" :key="index">{{ item }}</li>
      </ul>
    </div>
  </div>

  <!-- ==================== 示例 7：可选链操作符 ?. 安全访问 ==================== -->
  <div v-if="data?.list">
    <p>data.list 存在且非空，长度为：{{ data.list.length }}</p>
    <ul>
      <li v-for="(item, i) in data.list" :key="i">{{ item?.name ?? '未命名' }}</li>
    </ul>
  </div>
  <div v-else-if="data?.list === undefined">
    <p>data 或 data.list 为 undefined（安全访问避免报错）</p>
  </div>
  <div v-else>
    <p>data.list 存在但为空数组</p>
  </div>

  <!-- ==================== 示例 8：更深层嵌套的可选链 ==================== -->
  <article v-if="user?.profile?.address?.city">
    <h3>{{ user?.name }} 的城市</h3>
    <p>{{ user?.profile?.address?.city }}，{{ user?.profile?.address?.country }}</p>
  </article>
  <article v-else>
    <h3>{{ user?.name ?? '未知用户' }}</h3>
    <p>地址信息不完整</p>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue';

// 示例 1
const showTitle = ref(true);

// 示例 2
const isLoggedIn = ref(false);

// 示例 3
const type = ref('B');

// 示例 4
const hasPermission = ref(true);

// 示例 5：复杂条件
const userLevel = ref('free');
const isVIP = computed(() => userLevel.value === 'vip');
const isPremium = computed(() => userLevel.value === 'premium');

// 示例 6：嵌套条件
const status = ref('success');
const errorMessage = ref('');
const items = ref(['苹果', '香蕉', '橘子']);

function retry() {
  status.value = 'loading';
  // 模拟重新请求
  setTimeout(() => {
    status.value = 'success';
    items.value = ['苹果', '香蕉', '橘子', '葡萄'];
  }, 1000);
}

// 示例 7：可选链 ?.
const data = ref(null);
// 模拟异步获取数据
setTimeout(() => {
  data.value = {
    list: [{ name: '张三' }, { name: null }, { name: '李四' }],
  };
}, 2000);

// 示例 8：深层嵌套可选链
const user = ref({
  name: 'Alice',
  profile: {
    address: {
      city: '北京',
      country: '中国',
    },
  },
});
</script>

<style scoped>
section {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

button,
a {
  margin-left: 8px;
  padding: 4px 12px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

a {
  display: inline-block;
  text-decoration: none;
}

ul {
  padding-left: 20px;
}
</style>
