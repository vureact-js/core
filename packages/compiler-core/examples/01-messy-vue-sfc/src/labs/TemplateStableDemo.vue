<template>
  <section>
    <h2>{{ title }}</h2>
    <p v-if='items.length === 0'>No data</p>
    <ul v-else>
      <li v-for='item in items' :key='item.id'>{{ item.name }}</li>
    </ul>
    <input v-model='keyword' placeholder='keyword' />
    <button @click='count++'>count: {{ count }}</button>
  </section>
</template>

<script setup>
// @vr-name: TemplateStableDemo
import { ref } from 'vue';

const title = ref('Template Stable Demo');
const count = ref(0);
const keyword = ref('');
const items = ref([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
</script>