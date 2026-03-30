<template>
  <section class="page-grid">
    <PagePanel title="知识库检索">
      <template #extra>
        <AntSpace wrap>
          <AntInputSearch
            :value="keyword"
            allow-clear
            placeholder="搜索标题/内容"
            style="width: 260px"
            @change="onKeyword"
            @search="onSearch"
          />
          <AntSelect :value="tag" style="width: 160px" :options="tagOptions" @change="onTag" />
        </AntSpace>
      </template>

      <AntRow :gutter="[12, 12]" v-if="articles.length">
        <AntCol v-for="item in articles" :key="item.id" :xs="24" :md="12" :xl="8">
          <KnowledgeCard :item="item" />
        </AntCol>
      </AntRow>
      <EmptyState v-else text="没有匹配的知识条目" />

      <div class="pager-wrap">
        <AntPagination
          :current="page"
          :page-size="pageSize"
          :total="total"
          :show-size-changer="true"
          @change="onPageChange"
        />
      </div>
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: KnowledgeBase
import {
  Col as AntCol,
  Input as AntInput,
  Pagination as AntPagination,
  Row as AntRow,
  Select as AntSelect,
  Space as AntSpace,
} from 'antd';
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import KnowledgeCard from '../components/KnowledgeCard.vue';
import PagePanel from '../components/PagePanel.vue';
import { fetchKnowledgeArticles, fetchTags, type KnowledgeArticle } from '../data/mock-api';

const AntInputSearch = (AntInput as any).Search;

const keyword = ref('');
const tag = ref('all');
const tags = ref<string[]>([]);
const articles = ref<KnowledgeArticle[]>([]);
const page = ref(1);
const pageSize = ref(6);
const total = ref(0);

const tagOptions = computed<{ label: string; value: string }[]>(() => [
  { label: '全部标签', value: 'all' },
  ...tags.value.map((item) => ({ label: item, value: item })),
]);

const reload = async () => {
  const data = await fetchKnowledgeArticles({
    keyword: keyword.value,
    tag: tag.value,
    page: page.value,
    pageSize: pageSize.value,
  });

  articles.value = data.list;
  total.value = data.total;
};

const onKeyword = (event: any) => {
  keyword.value = event?.target?.value || '';
  page.value = 1;
  reload();
};

const onSearch = () => {
  page.value = 1;
  reload();
};

const onTag = (value: any) => {
  tag.value = value || 'all';
  page.value = 1;
  reload();
};

const onPageChange = (nextPage: number, nextSize: number) => {
  page.value = nextPage;
  pageSize.value = nextSize;
  reload();
};

onMounted(async () => {
  tags.value = (await fetchTags()) as string[];
  await reload();
});
</script>

<style scoped>
.page-grid {
  display: grid;
}

.pager-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
