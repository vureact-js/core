<template>
  <article class="kpi-card">
    <span class="label">{{ props.label }}</span>
    <strong class="value">{{ props.value }}</strong>
    <p class="desc">{{ props.desc }}</p>
  </article>
</template>

<script setup lang="ts">
// @vr-name: KpiCard
const props = defineProps<{
  label: string;
  value: string | number;
  desc: string;
}>();
</script>

<style scoped>
.kpi-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  display: grid;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: var(--muted);
}

.value {
  font-size: 24px;
}

.desc {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
</style>
