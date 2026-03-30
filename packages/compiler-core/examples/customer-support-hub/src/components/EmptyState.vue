<template>
  <AntEmpty :description="props.text" />
</template>

<script setup lang="ts">
// @vr-name: EmptyState
import { Empty as AntEmpty } from 'antd';

const props = defineProps<{ text: string }>();
</script>