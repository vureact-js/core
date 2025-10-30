<script setup lang="ts" react-name="Demo">
import {
  computed,
  onMounted,
  onUnmounted,
  onUpdated,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue';

// ======== 响应式状态 ========
const count = ref(0);
const user = reactive({
  firstName: 'Ada',
  lastName: 'Lovelace',
});

// ======== 计算属性 ========
const fullName = computed(() => `${user.firstName} ${user.lastName}`);
const doubleCount = computed(() => count.value * 2);

// ======== 侦听器 ========
watch(count, (newVal, oldVal) => {
  console.log(`[watch] count: ${oldVal} → ${newVal}`);
});

watchEffect(() => {
  console.log(`[watchEffect] fullName = ${fullName.value}`);
});

// ======== 生命周期 ========
onMounted(() => {
  console.log('[onMounted] 组件已挂载');
});
onUpdated(() => {
  console.log('[onUpdated] 组件更新');
});
onUnmounted(() => {
  console.log('[onUnmounted] 组件卸载');
});

// ======== 方法 ========
const increment = () => (count.value += 1);
const decrement = () => count.value--;
</script>

<template>
  <div class="demo">
    <h2>🧩 Vue 3 Composition API 示例</h2>

    <section class="counter">
      <h3>Counter</h3>
      <p>Count: {{ count }}</p>
      <p>Double: {{ doubleCount }}</p>
      <button @click="decrement">-</button>
      <button @click="increment">+</button>
    </section>

    <section class="user">
      <h3>User Info</h3>
      <input v-model="user.firstName" placeholder="First Name" />
      <input v-model="user.lastName" placeholder="Last Name" />
      <p>
        Full name: <strong>{{ fullName }}</strong>
      </p>
    </section>
  </div>
</template>

<style scoped>
.demo {
  font-family: system-ui, sans-serif;
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px #ccc;
}
button {
  margin: 0 4px;
  padding: 4px 8px;
}
input {
  display: block;
  margin: 6px 0;
  padding: 5px;
  width: 100%;
  box-sizing: border-box;
}
section {
  margin-bottom: 20px;
}
</style>
