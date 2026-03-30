<template>
  <section class="login-page">
    <AntCard class-name="login-card" :bordered="false" title="登录客户支持协同台">
      <AntTypographyParagraph type="secondary">演示账号默认填充，可直接进入系统。</AntTypographyParagraph>

      <AntForm layout="vertical" @finish="submit">
        <AntFormItem label="邮箱" name="email">
          <AntInput :value="email" placeholder="agent@support.local" @change="onEmail" />
        </AntFormItem>

        <AntFormItem label="密码" name="password">
          <AntInputPassword :value="password" placeholder="至少 3 位" @change="onPassword" />
        </AntFormItem>

        <AntAlert v-if="error" :message="error" type="error" show-icon style="margin-bottom: 12px" />

        <AntButton type="primary" html-type="submit" block :loading="loading">登录</AntButton>
      </AntForm>
    </AntCard>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SupportLogin
import {
  Alert as AntAlert,
  Button as AntButton,
  Card as AntCard,
  Form as AntForm,
  Input as AntInput,
  Typography as AntTypography,
} from 'antd';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '../../data/mock-api';

const AntFormItem = (AntForm as any).Item;
const AntInputPassword = (AntInput as any).Password;
const AntTypographyParagraph = (AntTypography as any).Paragraph;

const email = ref('agent@support.local');
const password = ref('123');
const error = ref('');
const loading = ref(false);

const router = useRouter();
const route = useRoute();

const onEmail = (event: any) => {
  email.value = event?.target?.value || '';
};

const onPassword = (event: any) => {
  password.value = event?.target?.value || '';
};

const submit = async () => {
  error.value = '';
  loading.value = true;

  try {
    await login({ email: email.value, password: password.value });
    router.push((route.query.redirect as string) || '/dashboard');
  } catch (e: any) {
    error.value = e?.message || '登录失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f4f7fb;
}

.login-card {
  width: min(440px, 92vw);
}
</style>
