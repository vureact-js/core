<template>
  <section class="page">
    <PagePanel title="知识库">
      <template #extra>
        <div class="filters">
          <input v-model="keyword" placeholder="搜索标题/内容" @input="reload" />
          <select v-model="tag" @change="reload">
            <option value="all">全部标签</option>
            <option v-for="item in tags" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
      </template>

      <div class="grid" v-if="articles.length">
        <KnowledgeCard v-for="item in articles" :key="item.id" :item="item" />
      </div>
      <EmptyState v-else text="没有匹配的知识条目" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: KnowledgeBase
import { onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import KnowledgeCard from '../components/KnowledgeCard.vue';
import PagePanel from '../components/PagePanel.vue';
import { fetchKnowledgeArticles, fetchTags, type KnowledgeArticle } from '../data/mock-api';

const keyword = ref('');
const tag = ref('all');
const tags = ref<string[]>([]);
const articles = ref<KnowledgeArticle[]>([]);

const reload = async () => {
  articles.value = await fetchKnowledgeArticles({ keyword: keyword.value, tag: tag.value });
};

onMounted(async () => {
  tags.value = await fetchTags();
  await reload();
});
</script>

<style scoped>
.page {
  display: grid;
}

.filters {
  display: flex;
  gap: 8px;
}

input,
select {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}
</style>
