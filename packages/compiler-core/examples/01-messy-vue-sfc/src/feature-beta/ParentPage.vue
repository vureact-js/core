<template>
  <section class='beta-panel'>
    <h2>feature-beta</h2>
    <ThemeCard :level='level' @upgrade='onUpgrade' />
  </section>
</template>

<script setup>
// @vr-name: ParentPage
import { provide, ref } from 'vue';
import ThemeCard from './ThemeCard.vue';
import AA from './AA.ts'

const level = ref(1);
provide('theme', 'ocean');

const onUpgrade = (next) => {
  level.value = next;
};
</script>

<style scoped>
.beta-panel { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; }
</style>