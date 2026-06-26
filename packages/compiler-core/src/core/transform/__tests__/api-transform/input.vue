<script setup>
import { onBeforeMount, onUpdated, provide, watchEffect } from 'vue';

const count = ref(2);
const state = reactive({ count: 2 });
const result = computed(() => (count.value + state.count) * 0.5);

const r = ref;

reactive;
reactive({ value: 2 });

watch;

onBeforeMount(() => {
  console.log('object');
});

onUpdated(() => {
  count.value++;
});

watch(
  () => count,
  (newVal, oldVal) => {},
);

watchEffect;

watchEffect((onCleanup) => {
  onCleanup(() => {});
  result.value;
});

provide(batchActionContextKey, {
  queue: computed(() => filters.value.queue),
  status: computed(() => filters.value.status),
});
</script>
