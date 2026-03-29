<template>
  <div class="timeline">
    <div v-for="item in props.items" :key="item.id" class="row">
      <span class="time">{{ item.time }}</span>
      <span class="text">{{ item.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: TicketTimeline
const props = defineProps<{ items: { id: string; text: string; time: string }[] }>();
</script>

<style scoped>
.timeline {
  display: grid;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px;
  font-size: 12px;
}

.time {
  color: var(--muted);
}
</style>
