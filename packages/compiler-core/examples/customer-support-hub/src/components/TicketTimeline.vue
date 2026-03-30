<template>
  <AntTimeline :items="timelineItems" />
</template>

<script setup lang="ts">
// @vr-name: TicketTimeline
import { Timeline as AntTimeline } from 'antd';
import { computed } from 'vue';

const props = defineProps<{ items: { id: string; text: string; time: string }[] }>();

const timelineItems = computed(() =>
  props.items.map((item) => ({
    key: item.id,
    children: `${item.time} · ${item.text}`,
  })),
);
</script>