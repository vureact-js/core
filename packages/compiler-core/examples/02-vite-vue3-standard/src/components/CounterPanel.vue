<template>
  <section class="card">
    <h2>{{ title }}</h2>
    <p>count: {{ count }}</p>
    <p>double: {{ doubleCount }}</p>
    <button @click="increment">+1</button>
  </section>
</template>

<script setup lang="ts">
// @vr-name: CounterPanel
import { computed, ref } from 'vue';

const title = ref<string>('Counter Panel');
const count = ref<number>(0);
const doubleCount = computed<number>(() => count.value * 2);

const increment = () => {
  count.value += 1;
};
</script>
