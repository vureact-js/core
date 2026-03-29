<template>
  <div class="meter">
    <AntProgress :percent="props.percent" :status="props.status" size="small" />
    <small>{{ props.label }}</small>
  </div>
</template>

<script setup lang="ts">
// @vr-name: SlaMeter
import { Progress as AntProgress } from 'antd';

const props = defineProps<{
  percent: number;
  label: string;
  status: 'normal' | 'exception' | 'success';
}>();
</script>

<style scoped>
.meter {
  display: grid;
  gap: 6px;
}

small {
  color: var(--muted);
}
</style>
