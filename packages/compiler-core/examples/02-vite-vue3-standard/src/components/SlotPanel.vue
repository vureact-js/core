<template>
  <slot name="logo"></slot>
  <h1>{{ props.title }}</h1>
  <section class="card">
    <strong>As you can see, this is a React app compiled from Vue via vureact.</strong>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SlotPanel
const props = defineProps<{ title: string }>();
</script>
