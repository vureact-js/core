<template>
  <section class="theme-card">
    <p>Theme: {{ theme }}</p>
    <p>Level: {{ props.level }}</p>
    <button @click="upgrade">Upgrade</button>
  </section>
</template>

<script setup>
// @vr-name: ThemeCard
import { inject } from 'vue';

const props = defineProps({ level: { type: Number, required: true } });
const emit = defineEmits(['upgrade']);
const theme = inject('theme', 'default');

const upgrade = () => {
  emit('upgrade', props.level + 1);
};
</script>

<style scoped>
.theme-card {
  display: grid;
  gap: 8px;
}
</style>
