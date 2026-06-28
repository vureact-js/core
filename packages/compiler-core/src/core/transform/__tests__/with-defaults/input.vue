<script setup lang="ts">
interface Props {
  msg?: string;
  count?: number;
  labels: string[];
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
  count: 42,
  labels: () => ['one', 'two'],
});
</script>

<template>
  <div>{{ props.msg }} {{ props.count }}</div>
  <ul>
    <li v-for="value in props.labels" :key="value">{{ value }}</li>
  </ul>
</template>
