<template>
  <div class="auth">
    <div class="card">
      <h1>注册新账号</h1>
      <p class="muted">完成注册后将自动登录。</p>
      <label>
        姓名
        <input v-model="name" placeholder="王琪" />
      </label>
      <label>
        邮箱
        <input v-model="email" placeholder="you@company.com" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" placeholder="至少 3 位" />
      </label>
      <button class="primary" @click="submit">注册并进入</button>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="footer">
        已有账号？
        <RouterLink to="/login">去登录</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: Register
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../../data/mock-api';

const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');

const submit = async () => {
  error.value = '';
  try {
    await register({ name: name.value, email: email.value, password: password.value });
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err?.message || '注册失败';
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
