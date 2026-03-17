<template>
  <div class="auth">
    <div class="card">
      <h1>登录 CRM 运营门户</h1>
      <p class="muted">使用演示账号即可进入系统。</p>
      <label>
        邮箱
        <input v-model="email" placeholder="you@company.com" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" placeholder="至少 3 位" />
      </label>
      <button class="primary" @click="submit">登录</button>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="footer">
        没有账号？
        <RouterLink to="/register">注册</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: Login
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '../../data/mock-api';

const router = useRouter();
const route = useRoute();

const email = ref('demo@crm.local');
const password = ref('123');
const error = ref('');

const submit = async () => {
  error.value = '';
  try {
    await login({ email: email.value, password: password.value });
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } catch (err: any) {
    error.value = err?.message || '登录失败';
  }
};
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg);
}

.card {
  width: min(420px, 90vw);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: grid;
  gap: 12px;
}

h1 {
  margin: 0;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
}

.muted {
  color: var(--muted);
  font-size: 12px;
}

.error {
  color: #dc2626;
  font-size: 12px;
}

.footer {
  font-size: 12px;
  color: var(--muted);
}
</style>
