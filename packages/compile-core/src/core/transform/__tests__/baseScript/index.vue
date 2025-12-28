<script setup lang="ts">
// @ts-nocheck

const props1 = defineProps(['foo', 'bar']);

const props2 = defineProps<{
  foo?: string;
  bar: number;
}>();

const props3 = defineProps({
  foo: String,
  bar: {
    type: Number,
    required: true,
  },
});

// 要点：
// 1.事件prop名一律使用 on + capitalize(key)，capitalize 已有了，直接调用即可。
// 2.带有 update: 前缀的去掉冒号，变成 onUpdate + Xxx，
// 3.isTS 的情况下根据是否有ts泛型进行处理：
//  3.1.最终ts类型格式都为 -> key: () => type，
//  3.2.只有事件名，如 ['change',...] 或这种写法 {change: [],...} 则默认函数返回值是 any，
//  3.3.若有事件参数别忘了附上参数。
// 4.exp 存储prop对象，tsType 存储 ts 泛型。
// 5.开始规范化所有 defineEmits 支持的写法。

// 示例：
// onChange: () => any
// onUpdate: () => any
// onUpdateName: () => any
const emit1 = defineEmits(['change', 'update', 'update:name']);
const emit2 = defineEmits<{
  change: []; // onChange: () => any
  update: [value: number]; // onUpdate: (value: number) => any
}>();
// onChange: () => void
// onUpdate: (value: number) => number
const emit3 = defineEmits<{ (e: 'change'): void; (e: 'update', value: number): number }>();
// onChange: () => boolean
// onUpdate: (value: string) => string
const emit4 = defineEmits<{
  change: () => boolean;
  update: (value: string) => string;
}>();

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
