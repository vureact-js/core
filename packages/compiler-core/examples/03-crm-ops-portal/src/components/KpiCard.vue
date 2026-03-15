<template>
  <div class="card" :class="trendClass">
    <p class="title">{{ props.title }}</p>
    <div class="value">{{ props.value }}</div>
    <p class="delta">{{ props.delta }}</p>
  </div>
</template>

<script setup lang="ts">
// @vr-name: KpiCard
import { computed } from 'vue';

const props = defineProps<{ title: string; value: string | number; delta: string; trend: 'up' | 'down' }>();

const trendClass = computed(() => (props.trend === 'up' ? 'trend-up' : 'trend-down'));
</script>

<style scoped lang="less">
.card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.title {
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 12px;
}

.value {
  font-size: 22px;
  font-weight: 700;
}

.delta {
  margin: 6px 0 0;
  font-size: 12px;
}

.trend-up .delta {
  color: #16a34a;
}

.trend-down .delta {
  color: #dc2626;
}
</style>
