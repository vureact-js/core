<template>
  <section>
    <div :class="$style.container">
      <h3 class="title">Style Pipeline</h3>
      <div :class="$style.content">Content</div>
    </div>
    <button class="button button-primary">Button</button>
  </section>
</template>

<script setup>
// @vr-name: StylePipelineDemo
</script>

<style module scoped lang="scss">
$primary-color: #1890ff;
$padding-base: 12px;

.container {
  padding: $padding-base;
  background-color: lighten($primary-color, 40%);

  .title { color: $primary-color; font-size: 24px; }

  .content {
    margin-top: $padding-base;
    border: 1px solid darken($primary-color, 10%);
    border-radius: 4px;
    padding: $padding-base / 2 $padding-base;
  }
}

.button { display: flex; margin-top: $padding-base; }

.button-primary {
  background-color: lighten($primary-color, 30%);
  color: darken($primary-color, 20%);
  border: 1px solid darken($primary-color, 10%);
  border-radius: 4px;
  padding: $padding-base / 2 $padding-base;
}
</style>