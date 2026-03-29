<template>
  <article class="card">
    <h4>{{ props.item.title }}</h4>
    <div class="tags">
      <span v-for="tag in props.item.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <p>{{ props.item.content }}</p>
    <small>更新于 {{ props.item.updatedAt }}</small>
  </article>
</template>

<script setup lang="ts">
// @vr-name: KnowledgeCard
const props = defineProps<{
  item: { id: string; title: string; tags: string[]; updatedAt: string; content: string };
}>();
</script>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
  background: #fff;
}

h4 {
  margin: 0;
}

p {
  margin: 0;
  color: var(--muted);
}

small {
  color: var(--muted);
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
