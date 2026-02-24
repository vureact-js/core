<template>
  <router-link to="/about" custom v-slot="{ href, navigate, isActive }">
    <a :href="href" @click="navigate">{{ isActive ? 'active' : 'about' }}</a>
  </router-link>

  <router-link to="/profile">
    <template #default="{ href, navigate }">
      <button @click="navigate">profile: {{ href }}</button>
    </template>
  </router-link>

  <button @click="goAbout">Go</button>
  <router-view />
</template>

<script setup lang="ts">
// @ts-ignore
import { onBeforeRouteLeave, onBeforeRouteUpdate, useLink, useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

onBeforeRouteLeave(() => true);
onBeforeRouteUpdate(() => true);

const goAbout = () => {
  router.push({ path: '/about', query: { from: route.fullPath } });
};

const broken = useLink({ to: '/about' });
</script>
