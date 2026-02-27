<script setup>
import { computed, reactive, ref, watch, watchEffect } from 'vue';

const count = ref(1);
const state = reactive({ count: 1 });
const result = computed(() => count.value + state.count);

const r = ref;

reactive;
reactive({ value: 2 });

watch;

watch(
  () => count,
  (newVal, oldVal) => {},
);

watchEffect;

watchEffect((onCleanup) => {
  onCleanup(() => {});
  result.value;
});
</script>
