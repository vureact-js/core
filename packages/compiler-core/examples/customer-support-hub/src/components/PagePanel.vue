<template>
  <section class="panel">
    <header class="head">
      <h3>{{ props.title }}</h3>
      <slot name="extra" />
    </header>
    <div class="body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: PagePanel
const props = defineProps<{ title: string }>();
</script>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

h3 {
  margin: 0;
}
</style>
