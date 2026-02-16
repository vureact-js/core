<template>
  <p ref="p">hello</p>
  <div ref="div">vureact</div>
  <span :ref="(el) => (spanRef = el)">Abc</span>
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';

// 1.应将 useTemplateRef 替换成 useRef
// 2.应将 useRef 的值替换成 null
// 3.应为 useRef 推导出对应 HTML 类型接口
// 4.应将 useTemplateRef 的 .value 属性替换为 .current
// 5.应将模板中的 ref 字符串值替换为对应的 useRef 变量访问
// 6.应将模板中的 :ref 表达式内容，将 ref() 变量加上 .value 后缀，useRef 变量加上 .current

const pRef = useTemplateRef<HTMLParagraphElement>('p');
const divRef = useTemplateRef('div');
const spanRef = ref();

onMounted(() => {
  const divEl = divRef.value;
  if (divEl && pRef.value) {
    divEl.className = 'div';
    pRef.value.style.background = 'red';
  }
});
</script>
