<script setup lang="ts">
// @ts-nocheck
const count = ref<number | string>([1]);

const obj = reactive({ f: 1 });

const value = readonly(1);

const double = computed(() => count.value[0] + obj?.f);

const 函数_易语言 = (参数: number): number => {
  let 值 = 0;

  const 嵌套函数 = () => {
    值 += count.value + 参数;
  };

  嵌套函数();
  return 值;
};
</script>
