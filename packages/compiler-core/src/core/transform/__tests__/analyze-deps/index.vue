<script setup lang="ts">
import { reactive, ref } from 'vue';

const count = ref(0);
const foo = ref(0);
const state = reactive({ foo: 'bar', bar: { c: 1 } });

// 应分析箭头函数中的依赖并转成 useCallback
const fn1 = () => {
  count.value += state.bar.c;
  console.log(count.value);
};

// 应被追加为 useCallback
const fn = () => {};

// 应分析
const fn2 = () => {
  // 应溯源，并收集 foo.value
  const c = foo.value;
  fn();
  // 应忽略局部箭头函数
  const fn4 = () => {
    state.bar.c--;
    c + count.value;
  };
};

// 应分析
const fn3 = () => {
  foo.value++;

  // 应忽略函数内部的创建的响应式变量
  const state = ref('fake');

  // 应忽略与外部响应式变量 count 同名的
  const count = state.value + 'yoxi';
  count.charAt(1);
};

// 普通函数应忽略
function fn4() {
  const t = state.foo;

  // 应忽略
  return () => {
    state.foo = 'barr';
  };
}

// @ts-ignore
callback(() => {
  // 回调函数应忽略
  count.value++;
});

// 类/普通对象的方法成员应忽略
class Foo {
  bar = () => {
    count.value;
  };
}

const methods = {
  fn: () => {
    state.foo;

    const fn = () => {
      foo.value;
    };
  },
};

const objRef = ref({ a: 1 });
const listRef = ref([1, 2, 3]);

const chainFn = () => {
  state.foo;
  count.value;
  objRef.value.a;
};

const dynamicFn = () => {
  // @ts-ignore
  state[Date.now()];
  // @ts-ignore
  foo?.[count.value];
};

const aliasA = state.foo;
const aliasB = aliasA;
const aliasC = aliasB;

// 应分析并溯源 aliasC，最终收集 state.foo
const traceFn = () => {
  aliasC;
};

const { foo: stateFoo } = state;
const [first] = listRef.value;

// 应分析
const destructureFn = () => {
  stateFoo; // 溯源并收集到 state
  first; // 溯源并收集到 listRef.value
};

const bad = Date.now() + 1;
// 应忽略
const badFn = () => {
  bad;
};
</script>
