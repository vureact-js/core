<template>
  <slot>
    <div>默认内容</div>
    <div>我测</div>
  </slot>

  <button type="submit">
    <slot name="submit-text"> Submit </slot>
  </button>

  <!-- 顺便测一下动态插槽名 -->
  <base-layout>
    <template v-slot:[dynamicSlotName]> ... </template>

    <!-- 缩写为 -->
    <template #[dynamicName]> ... </template>
  </base-layout>
</template>

<script setup></script>
