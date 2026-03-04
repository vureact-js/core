<template>
  <main class="shell">
    <h1>VuReact -> Vite Vue3 Standard Example</h1>
    <CounterPanel />
    <SlotPanel />
  </main>
</template>

<script setup lang="ts">
// @ts-nocheck
// @vr-name: ViteStandardApp
import CounterPanel from './components/CounterPanel.vue';
import SlotPanel from './components/SlotPanel.vue';
</script>
