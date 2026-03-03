<template>
  <article class='card'>
    <h3>{{ props.name }}</h3>
    <p>Age: {{ props.age }}</p>
    <button @click='follow'>Follow</button>
  </article>
</template>

<script setup>
// @vr-name: UserCard
import { ref } from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  age: { type: Number, required: true },
});
const emit = defineEmits(['follow']);
const followCount = ref(0);

const follow = () => {
  followCount.value += 1;
  emit('follow', { name: props.name, count: followCount.value });
};
</script>

<style scoped>
.card { display: grid; gap: 8px; background: #f9fafb; padding: 12px; border-radius: 10px; }
</style>