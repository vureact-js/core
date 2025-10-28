<script setup lang="ts" component-name="ScriptTest">
import {
  computed,
  nextTick,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  onUpdated,
  readonly,
  ref,
  watch,
  watchEffect,
} from 'vue';

const props = defineProps<{
  title: string;
  count?: number;
  count3?: number;
  count4?: number;
  count5?: number;
}>();
const emit = defineEmits<{ 'update:title': [value: string]; click: [] }>();

const count = ref(0);
const doubled = computed(() => count.value * 2);
const state = ref({ nested: { value: 1 } });
const arr = ref([1]);
const readObj = readonly({ name: 'jack' });

nextTick(() => {
  console.log('nextTick');
});

onMounted(() => console.log('mounted'));
onMounted(async () => {
  console.log('async onMounted');
});
onUnmounted(() => console.log('unmounted'));

onBeforeUpdate(() => {});
onUpdated(() => {});
onUpdated(async () => {
  console.log('async onUpdated');
});

watchEffect(() => {
  count.value++;
  return () => {
    count.value = 0;
  };
});

watch(
  () => state.value,
  () => {
    console.log(state.value.nested.value);
  },
);

watch([count, doubled], () => {
  return () => console.log(count.value + doubled.value);
});

watch(
  [count],
  () => {
    console.log('watch once');
  },
  { once: true },
);

watch(
  () => {},
  () => {
    console.log('watch immediate call');
  },
  { immediate: true },
);

watch(
  () => {},
  () => {
    console.log('deep watch');
  },
  { deep: true },
);

function handleClick() {
  count.value;
}

function callClick() {
  handleClick();
  console.log('Collect handleClick');
}

count.value = 3;
count.value = doubled.value;
count.value++;
count.value -= 1;

arr.value.push(2);
arr.value.pop();
arr.value.length = 0;

state.value.nested.value = 3;
state.value.nested = { value: 8 };
</script>
