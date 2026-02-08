<template>
  <div>
    <slot name="header" title="title"></slot>
    <slot></slot>
    <slot name="footer" :count="1"></slot>
  </div>
</template>

<script setup lang="ts">
interface Props<T> {
  foo?: string;
  bar: number;
  dj: T;
}

const $$props = defineProps(['foo', 'bar']);

// const $$props = defineProps({
//   foo: String,
//   bar: {
//     type: Number,
//     required: true,
//   },
// });

// const $$props = defineProps<{
//   foo?: string;
//   bar: number;
// }>();

// const $$props = defineProps<Props>();

// const $$props = defineProps<Props<any>>();

// const $$props = defineProps<Props & { x: string }>();

// const $$props = defineProps<Props | ({ a: string } | { b: number })>();

interface Emits {
  change: string;
  (e: 'update', value: number): number;
}

const $$emits = defineEmits(['change', 'update', 'update:name']);

// const $$emits = defineEmits<{
//   change: [];
//   update: [value: number];
// }>();

// const $$emits = defineEmits<{ (e: 'change'): void; (e: 'update', value: number): number }>();

// const $$emits = defineEmits<Partial<{ (e: 'change'): void;}>>();

// const $$emits = defineEmits<Emits>();

interface Slots {
  default?(): any;
  header(props: { title: string }): any;
  footer(props: { count: number }): any;
}

const $$slots = defineSlots<{
  default?(): any;
  header(props: { title: string }): any;
  footer(props: { count: number }): any;
}>();

// const $$slots = defineSlots<Slots>();
</script>
