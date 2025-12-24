<script setup lang="ts">
// @ts-nocheck
const count = ref<number | string>([1]);

const state = reactive({
  foo: 1,
  bar: 2,
});

const value = readonly(1);

const double = computed(() => count.value[0] + state?.foo);

const stateRef = toRef(state, 'foo');

const stateRef2 = toRef(
  reactive({
    foo: 1,
    bar: 2,
  }),
  foo,
);

const numRef = toRef(1);

const stateRefs = toRefs(state);

ref(1);
reactive({});
readonly(1);
computed(() => 1);

const 函数 = (参数: number): number => {
  let 值 = 0;

  const 嵌套函数 = () => {
    值 += count.value + 参数;
  };

  嵌套函数();
  return 值;
};

const fn2 = function () {
  state.foo + stateRefs.bar;
};

function fn3() {
  count.value;
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
  state.foo;
  console.log('beforeUpdate');
});

const updated = () => {
  count.value;
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
