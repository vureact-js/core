<script setup lang="ts">
// @ts-nocheck
const count = ref<number | string>([1]);

const obj = reactive({ f: () => 1 });

const value = readonly(1);

const double = computed(() => count.value[0] + obj.f());
</script>
