<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>客户管理</h2>
        <p class="muted">覆盖活跃、沉默与流失客户，支持快速筛选。</p>
      </div>
      <button class="primary">新建客户</button>
    </header>

    <FilterBar v-model="keyword" v-model:status="status" />

    <CustomerTable :customers="filtered" @select="onSelect">
      <template #row="{ customer }">
        <strong>{{ customer.name }}</strong>
        <div class="muted">负责人：{{ customer.owner }}</div>
      </template>
      <template #empty>
        <p>没有找到符合条件的客户</p>
      </template>
    </CustomerTable>

    <div v-if="selected" class="selection">
      已选择：{{ selected.name }}（{{ selected.id }}）
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: Customers
import { computed, ref } from 'vue';
import CustomerTable from '../components/CustomerTable.vue';
import FilterBar from '../components/FilterBar.vue';
import { customers as source } from '../data/mock';

type Customer = (typeof source)[0];

const keyword = ref('');
const status = ref('all');
const selected = ref<Customer | null>(null);

const filtered = computed(() => {
  return source.filter((item) => {
    const hitKeyword = item.name.includes(keyword.value) || item.owner.includes(keyword.value);
    const hitStatus = status.value === 'all' || item.status === status.value;
    return hitKeyword && hitStatus;
  });
});

const onSelect = (customer: Customer) => {
  selected.value = customer;
};

</script>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.muted {
  color: var(--muted);
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
}

.selection {
  padding: 12px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
