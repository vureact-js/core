<script setup lang="ts">
// @ts-nocheck
const count1 = ref(0);
const count2 = ref(0) as number;
const count3 = ref<number>(0);
const count4: number = ref(0);
const obj = reactive({ a: 'b' });
const double = computed(() => count.value * 2);
</script>
