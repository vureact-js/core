<template>
  <AntCard size="small" variant="borderless">
    <AntStatistic :title="props.label" :value="props.value" />
    <AntTypographyText type="secondary">{{ props.desc }}</AntTypographyText>
  </AntCard>
</template>

<script setup lang="ts">
// @vr-name: KpiCard
import { Card as AntCard, Statistic as AntStatistic, Typography as AntTypography } from 'antd';

const AntTypographyText = (AntTypography as any).Text;

const props = defineProps<{
  label: string;
  value: string | number;
  desc: string;
}>();
</script>
