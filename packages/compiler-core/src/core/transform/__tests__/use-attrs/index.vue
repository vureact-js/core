<template>
  <div :class="['red', attrs.class]"></div>
</template>

<script setup lang="ts">
// @ts-nocheck

/**
 * Vue 组件
 */

import { useAttrs } from 'vue';

// 来自 xx
// AAA
import { A } from 'Aa';

/* B 组件 */
import { B } from 'Bb';

/**
 * 透传属性接口
 */
interface Attrs {
  class?: string;
  style?: string;
}

defineProps<{ title: string }>();

// 带类型注解
const attrs: Attrs = useAttrs();

// 解构 useAttrs + 类型断言
const { style, class: cls } = useAttrs() as Attrs;

// 类型注解
const destructured: {
  class?: string;
  style?: string;
} = useAttrs();
</script>
