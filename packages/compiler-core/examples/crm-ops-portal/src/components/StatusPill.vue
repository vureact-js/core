<template>
  <span :class="$style.pill" :data-variant="props.variant">{{ props.label }}</span>
</template>

<script setup lang="ts">
// @vr-name: StatusPill
const props = defineProps<{ label: string; variant: 'success' | 'warning' | 'danger' | 'info' }>();
</script>

<style module scoped lang="scss">
$pill-colors: (
  success: #22c55e,
  warning: #f59e0b,
  danger: #ef4444,
  info: #3b82f6,
);

.pill {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #f3f4f6;
  color: #111827;
}

@each $name, $color in $pill-colors {
  .pill[data-variant='#{$name}'] {
    background: rgba($color, 0.12);
    color: $color;
  }
}
</style>
