<template>
  <AntCard :title="props.title" size="small" variant="borderless">
    <template #extra>
      <slot name="extra" />
    </template>
    <slot />
  </AntCard>
</template>

<script setup lang="ts">
// @vr-name: PagePanel
import { Card as AntCard } from 'antd';

const props = defineProps<{ title: string }>();
</script>
