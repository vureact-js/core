<template>
  <div
    :class="[
      'red',
      attrs.class,
      attrs.xx.class,
      attrs['class'],
      attrs.xx['class'],
      attrs?.['class'],
    ]"
  >
    {{ attrs?.xxx?.['class'] }}
  </div>

  <template v-if="attrs?.class">
    <span :class="attrs.class">
      {{ attrs?.xxx?.class }}
    </span>
  </template>

  <template v-for="value in source" :key="value">
    <div>{{ value }}</div>
  </template>

  <template>dawdw</template>
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

const props = defineProps<{ title: string; class: string }>();

const attrs = useAttrs();

// 解构 useAttrs + 类型断言
const { style, class: cls } = useAttrs() as Attrs;

// 带类型注解
const destructured: Attrs = useAttrs();

void A;
void B;

if (attrs?.class || props.class) {
  const cls = attrs.class + 'red';
  console.log(attrs.class, cls, props.class);
}
</script>
