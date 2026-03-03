<template>
  <section class='card'>
    <h2>{{ props.title }}</h2>
    <small>slot panel fallback content</small>
  </section>
</template>

<script setup>
// @vr-name: SlotPanel
const props = defineProps({
  title: {
    type: String,
    default: 'Slot Panel',
  },
});
</script>