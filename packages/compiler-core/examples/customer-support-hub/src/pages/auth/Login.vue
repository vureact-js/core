<template>
  <section class="login-page">
    <div class="card">
      <h2>登录客服协同台</h2>
      <p>演示账号默认填充，可直接进入系统。</p>

      <label>
        邮箱
        <input v-model="email" placeholder="agent@support.local" />
      </label>

      <label>
        密码
        <input v-model="password" type="password" placeholder="至少 3 位" />
      </label>

      <AntButton type="primary" @click="submit">登录</AntButton>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SupportLogin
import { Button as AntButton } from 'antd';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '../../data/mock-api';

const email = ref('agent@support.local');
const password = ref('123');
const error = ref('');

const router = useRouter();
const route = useRoute();

const submit = async () => {
  error.value = '';
  try {
    await login({ email: email.value, password: password.value });
    router.push((route.query.redirect as string) || '/dashboard');
  } catch (e: any) {
    error.value = e?.message || '登录失败';
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.card {
  width: min(420px, 90vw);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  display: grid;
  gap: 10px;
}

h2 {
  margin: 0;
}

p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 10px;
}

.error {
  color: #dc2626;
}
</style>
