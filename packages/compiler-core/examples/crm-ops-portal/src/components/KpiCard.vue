<template>
  <div class="card" :class="trendClass">
    <p class="title">{{ props.title }}</p>
    <div class="value">{{ props.value }}</div>
    <div class="meta">
      <p class="delta">{{ props.delta }}</p>
      <span v-if="props.sub" class="sub">{{ props.sub }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: KpiCard
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: string | number;
  delta: string;
  trend: 'up' | 'down';
  sub?: string;
}>();

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

.meta {
  margin: 6px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delta {
  margin: 0;
  font-size: 12px;
}

.sub {
  font-size: 12px;
  color: #6b7280;
}

.trend-up .delta {
  color: #16a34a;
}

.trend-down .delta {
  color: #dc2626;
}
</style>
