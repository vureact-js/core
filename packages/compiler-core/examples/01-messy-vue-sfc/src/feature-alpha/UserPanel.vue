<template>
  <section class='alpha-panel'>
    <h2>feature-alpha</h2>
    <UserCard :name='user.name' :age='user.age' @follow='onFollow' />
    <p>Total follows: {{ totalFollows }}</p>
  </section>
</template>

<script setup>
// @vr-name: UserPanel
import { ref } from 'vue';
import UserCard from './UserCard.vue';

const user = ref({ name: 'Ada', age: 26 });
const totalFollows = ref(0);

const onFollow = (payload) => {
  totalFollows.value = payload.count;
};
</script>

<style scoped>
.alpha-panel { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; }
</style>