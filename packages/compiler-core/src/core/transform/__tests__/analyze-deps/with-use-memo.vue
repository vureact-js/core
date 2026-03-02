<script setup lang="ts">
import { reactive, ref } from 'vue';

const fooRef = ref(0);
const reactiveState = reactive({ foo: 'bar', bar: { c: 1 } });

// obj 应被优化成 useMemo 调用
const memoizedObj = {
  title: 'test',
  bar: fooRef.value,
  add: () => {
    reactiveState.bar.c++;
  },
};

// 应忽略处理
const staticObj = {
  foo: 1,
  state: { bar: { c: 1 } },
};

const reactiveList = [fooRef.value, 1, 2];
const staticList = [1, 2, 3];
const mixedList = [
  { name: reactiveState.foo, age: fooRef.value },
  { name: 'A', age: 20 },
];

// 应被优化
const nestedObj = {
  a: {
    b: {
      c: reactiveList[0], // list[0] 是响应式的，应被收集
      d: () => {
        return memoizedObj.bar; // 应被收集
      },
    },
    e: mixedList, // 引用整个数组，但数组中包含有响应式值，应被收集
  },
};

const computeFn = () => {
  memoizedObj.add();
  return nestedObj.a.b.d();
};

const formattedValue = memoizedObj.bar.toFixed(2);
</script>
