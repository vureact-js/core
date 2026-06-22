<script setup lang="ts">
// @vr-name: Child
// @ts-nocheck

// 声明 "state" prop，由父组件通过 v-model:state 使用
const state = defineModel<string>('state');

// 声明带选项的 "modelValue" prop，由父组件通过 v-model 使用
const modelValue = defineModel({ default: 'xxx' });

// 声明带选项的 "count" prop，由父组件通过 v-model:count  使用
const count = defineModel<number>('count', { type: Number, default: 0, required: true });

// 不支持的变量数组解构
// const [arg1, arg2] = defineModel();

// 不支持的 get/set/validator 选项
// const modelValue = defineModel({ get() {}, set() {}, validator() {} });

const update = () => {
  // 在被修改时，触发 "update:state" 事件
  state.value = 'hello';
  // 在被修改时，触发 "update:count" 事件
  count.value++;
};
</script>

<template>
  <input v-model="modelValue" />
  <div>Parent bound v-model is: {{ count }}</div>
  <button @click="update">Increment</button>
</template>
