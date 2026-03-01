<template>
  <div :class="$style['hello-container']">
    <h1>{{ greetingMessage }}</h1>
    <p>计数器: **{{ count }}**</p>
    <button @click="increment">点击我增加计数</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const count = ref<number>(0);
const name = ref('Vue 3');

const greetingMessage = computed(() => {
  return `你好，欢迎来到 ${name.value} 的世界!`;
});

const increment = () => {
  count.value++;
};

const route = useRoute();

onMounted(() => {
  console.log('组件已挂载！');
});
</script>

<style module scoped>
.hello-container {
  padding: 20px;
  border: 1px solid #42b883;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  margin: 20px auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #35495e;
  margin-bottom: 10px;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #33a06a;
}
</style>
