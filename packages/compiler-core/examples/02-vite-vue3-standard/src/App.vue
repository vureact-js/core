<template>
  <main class="shell">
    <SlotPanel title="VuReact -> Vite + React">
      <template #logo>
        <div>
          <img class="logo" src="/public/vureact.webp" />
        </div>
      </template>
    </SlotPanel>
    <CounterPanel />
  </main>
</template>

<script setup lang="ts">
// @ts-nocheck
// @vr-name: ViteStandardApp
import CounterPanel from './components/CounterPanel.vue';
import SlotPanel from './components/SlotPanel.vue';
import './styles/app.css';
</script>
