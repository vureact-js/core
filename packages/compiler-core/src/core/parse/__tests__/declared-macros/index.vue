<script setup lang="ts">
defineOptions({
  name: 'AvCard',
  inheritAttrs: false,
});

// const props = defineProps(['foo', 'bar']);

// const props = defineProps({
//   foo: String,
//   bar: {
//     type: Number,
//     required: true,
//   },
// });

const props = defineProps<{
  foo?: string;
  bar: number;
}>();

interface Emits {
  change: string;
  (e: 'update', value: number): number;
}

const emits = defineEmits<Emits>();

// const emits = defineEmits(['change', 'update', 'update:name']);

// const emits = defineEmits<{
//   change: [];
//   update: [value: number];
// }>();

// const emits = defineEmits<{ (e: 'change'): void; (e: 'update', value: number): number }>();
</script>
