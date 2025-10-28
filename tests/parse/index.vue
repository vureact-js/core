<template component-name="MyComponent">
  <div
    v-if="count > 0"
    :class="{ active: state.isActive }"
    @[eventName]="handleClick(count)"
    :style="myStyle"
  >
    Current count is: {{ count + 1 }}.
  </div>
  <TheComponent :is="componentName" />
  <input ref="input" />
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

const count = ref(1);

const input = ref<HTMLInputElement>();
/* @non-reactive */
const forever = ref(null);

const state = reactive({ isActive: true });
const doubled = computed(() => count.value * 2);

const myStyle = 'color: red;';
const eventName = 'click';
const componentName = 'MyButton';

function handleClick(val: number) {
  console.log('Clicked', val);
}
</script>

<style scoped>
.test {
  color: v-bind(myStyle);
}
</style>
