<script setup lang="ts">
// @ts-nocheck
import { computed, defineAsyncComponent, reactive, ref } from 'vue';
import Count from 'Count.vue';
import type Type from 'type';

interface Props {}

type A = {};

enum B {}

const __props = defineProps(['foo', 'bar']);

// const __props = defineProps<Props>();

// const __props = defineProps<{
//   foo?: string;
//   bar: number;
// }>();

// const __props = defineProps({
//   foo: String,
//   bar: {
//     type: Number,
//     required: true,
//   },
// });

const __emits = defineEmits(['change', 'update', 'update:name']);

// const __emits = defineEmits<{
//   change: [];
//   update: [value: number];
// }>();

// const __emits = defineEmits<{ (e: 'change'): void; (e: 'update', value: number): number }>();

const AdminPage = defineAsyncComponent(() => import('./components/AdminPageComponent.vue'));

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
});

const MAX_VALUE = 999;

const person = {
  name: 'k',
  age: 1,
};

const LIST = [1, MAX_VALUE, person.age];

const elRef = ref<HTMLDivElement | null>(null);

const count = ref<number | string>(1);

const state = reactive({
  foo: 1,
  bar: 2,
  list: LIST,
});

const value = readonly(1);

const double = computed(() => count.value + state?.foo);

const stateRef = toRef(state, 'foo');

const numRef = toRef(1);

const stateRefs = toRefs(state);

const 函数 = (参数: number): number => {
  let 值 = 0;

  const 嵌套函数 = () => {
    值 += count.value + 参数;
  };

  嵌套函数();
  return 值;
};

const fn2 = function (count) {
  state.foo = count + stateRefs.bar;
  state.list.push({
    k: Date.now().toString(),
    v: state.foo,
  });
};

function fn3() {
  count.value++;
}

onBeforeMount(() => {
  console.log('beforeMount');
});

onMounted(async () => {
  console.log('mounted');
});

onBeforeUnmount(() => {
  console.log('beforeUnmount');
});

onUnmounted(function () {
  console.log('unmounted');
});

onBeforeUpdate(() => {
  state.foo = 0;
  console.log('beforeUpdate');
});

const updated = () => {
  count.value++;
  fn2();
  console.log('updated');
};

onUpdated(updated);

const updatedWithNoDeps = () => {
  console.log('updated');
};

onUpdated(updatedWithNoDeps);

watchEffect(() => {
  if (state.foo >= 10) {
    fn2();
  }
  state.foo++;
  console.log('watchEffect');
});

watchSyncEffect(() => {
  state.foo++;
  console.log('watchSyncEffect');
});

watchEffect((onCleanup) => {
  count.value;
  onCleanup(() => {
    console.log('watchEffect cleanup');
  });
});

watch(count.value, () => {
  console.log(count.value);
});

watch(
  state,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
  },
  { deep: true },
);

watch(
  () => count.value,
  () => {
    console.log(count.value);
  },
  { once: true },
);

const stop = watch(
  () => [count.value, state],
  (newVal) => {
    console.log(newVal);
  },
);
</script>
