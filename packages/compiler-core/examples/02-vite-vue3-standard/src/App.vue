<template>
  <main class='shell'>
    <h1>Vite Vue3 Standard Example</h1>
    <CounterPanel />
    <SlotPanel />
  </main>
</template>

<script setup>
// @vr-name: ViteStandardApp
import CounterPanel from './components/CounterPanel.vue';
import SlotPanel from './components/SlotPanel.vue';
</script>