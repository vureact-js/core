<script setup lang="ts">
// @ts-nocheck
const count = ref<number | string>([1]);

const state = reactive({
  foo: 1,
  bar: 2,
});

const value = readonly(1);

const double = computed(() => count.value[0] + state?.foo);

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
  state.foo;
};

function fn3() {
  count.value;
}
</script>
