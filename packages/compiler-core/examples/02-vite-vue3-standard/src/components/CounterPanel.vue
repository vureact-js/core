<template>
  <section class='card'>
    <h2>{{ title }}</h2>
    <p>count: {{ count }}</p>
    <p>double: {{ doubleCount }}</p>
    <button @click='increment'>+1</button>
  </section>
</template>

<script setup>
// @vr-name: CounterPanel
import { computed, ref } from 'vue';

const title = ref('Counter Panel');
const count = ref(0);
const doubleCount = computed(() => count.value * 2);
const increment = () => { count.value += 1; };
</script>