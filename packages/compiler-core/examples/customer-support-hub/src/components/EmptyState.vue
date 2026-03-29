<template>
  <div class="empty">{{ props.text }}</div>
</template>

<script setup lang="ts">
// @vr-name: EmptyState
const props = defineProps<{ text: string }>();
</script>

<style scoped>
.empty {
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 20px 12px;
}
</style>
