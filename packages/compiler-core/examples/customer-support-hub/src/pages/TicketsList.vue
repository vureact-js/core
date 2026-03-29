<template>
  <section class="page">
    <TicketFilterBar
      :keyword="filters.keyword"
      :status="filters.status"
      :priority="filters.priority"
      :owner="filters.owner"
      :owners="owners"
      @update:keyword="(v) => updateFilter('keyword', v)"
      @update:status="(v) => updateFilter('status', v)"
      @update:priority="(v) => updateFilter('priority', v)"
      @update:owner="(v) => updateFilter('owner', v)"
    />

    <PagePanel title="工单列表">
      <div class="rows" v-if="rows.length">
        <article class="row" v-for="item in rows" :key="item.id">
          <div>
            <strong>{{ item.id }} · {{ item.title }}</strong>
            <p>{{ item.customer }} · {{ item.owner }} · {{ item.priority }}</p>
          </div>
          <div class="actions">
            <TicketStatusTag :status="item.status" />
            <AntButton size="small" @click="toDetail(item.id)">查看详情</AntButton>
          </div>
        </article>
      </div>
      <EmptyState v-else text="没有匹配的工单" />
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: TicketsList
import { Button as AntButton } from 'antd';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '../components/EmptyState.vue';
import PagePanel from '../components/PagePanel.vue';
import TicketFilterBar from '../components/TicketFilterBar.vue';
import TicketStatusTag from '../components/TicketStatusTag.vue';
import { fetchOwners, fetchTickets, type Ticket } from '../data/mock-api';
import { appStore } from '../store/useAppStore';

const router = useRouter();
const rows = ref<Ticket[]>([]);
const owners = ref<string[]>([]);
const filters = ref(appStore.getState().ticketFilters);

appStore.subscribe((state) => {
  filters.value = state.ticketFilters;
});

const reload = async () => {
  rows.value = await fetchTickets(filters.value);
};

const updateFilter = (key: keyof typeof filters.value, value: string) => {
  appStore.getState().setTicketFilters({ [key]: value });
  reload();
};

const toDetail = (id: string) => {
  router.push(`/tickets/${id}`);
};

onMounted(async () => {
  owners.value = await fetchOwners();
  await reload();
});
</script>

<style scoped>
.page {
  display: grid;
  gap: 12px;
}

.rows {
  display: grid;
  gap: 8px;
}

.row {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.row p {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
