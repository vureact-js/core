<script setup lang="ts">
import { reactive, ref } from 'vue';

const foo = ref(0);
const state = reactive({ foo: 'bar', bar: { c: 1 } });

// obj 应被优化成 useMemo 调用
const obj = {
  title: 'test',
  bar: foo.value,
  add: () => {
    state.bar.c++;
  },
};

// 应忽略处理
const obj2 = {
  foo: 1,
  state: { bar: { c: 1 } },
};

// 应被优化，且 obj.bar 也应被作为依赖收集
const obj3 = {
  a: {
    b: {
      c: foo.value,
      d: () => {
        return obj.bar;
      },
    },
  },
};

const list = [foo.value, 1, 2];
const list2 = [1, 2, 3];
const list3 = [{ name: state.foo, age: foo.value }];
</script>
