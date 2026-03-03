<template>
  <main class="app-shell">
    <header class="hero">
      <img class="logo" src="./assets/demo.svg" alt="demo" />
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ summary }}</p>
    </header>

    <UserPanel />
    <ParentPage />
    <TemplateStableDemo />
    <StylePipelineDemo />
  </main>
</template>

<script setup>
// @vr-name: MessyExampleApp
import { computed } from 'vue';
import UserPanel from './feature-alpha/UserPanel.vue';
import ParentPage from './feature-beta/ParentPage.vue';
import StylePipelineDemo from './labs/StylePipelineDemo.vue';
import TemplateStableDemo from './labs/TemplateStableDemo.vue';

const title = 'Messy Vue SFC Playground';
const summary = computed(() => `${title} / pre-release-e2e`);
</script>

<style scoped>
.app-shell { display: grid; gap: 20px; padding: 24px; max-width: 960px; margin: 0 auto; }
.hero { padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
.logo { width: 48px; height: 48px; }
.subtitle { color: #6b7280; margin: 0; }
</style>