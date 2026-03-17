<template>
  <div class="table-card">
    <table v-if="props.customers.length" class="table">
      <thead>
        <tr>
          <th>客户</th>
          <th>行业</th>
          <th>负责人</th>
          <th>状态</th>
          <th>评分</th>
          <th>最近跟进</th>
          <th>ARR</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in props.customers" :key="customer.id" @click="select(customer)">
          <td>
            <slot name="row" :customer="customer">
              <strong>{{ customer.name }}</strong>
              <div class="muted">{{ customer.id }}</div>
            </slot>
          </td>
          <td>{{ customer.industry }}</td>
          <td>{{ customer.owner }}</td>
          <td>
            <StatusPill :label="customer.status" :variant="statusVariant(customer.status)" />
          </td>
          <td>{{ customer.score }}</td>
          <td>{{ customer.lastTouch }}</td>
          <td>{{ customer.arr }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty">
      <slot name="empty">
        <p>没有匹配的客户</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// @vr-name: CustomerTable
import StatusPill from './StatusPill.vue';

type Customer = {
  id: string;
  name: string;
  owner: string;
  status: string;
  score: number;
  industry: string;
  lastTouch: string;
  arr: string;
};

const props = defineProps<{ customers: Customer[] }>();
const emit = defineEmits<{ (e: 'select', customer: Customer): void }>();

function select(customer: Customer) {
  emit('select', customer);
}

function statusVariant(status: string) {
  if (status === '活跃') return 'success';
  if (status === '沉默') return 'warning';
  return 'danger';
}
</script>

<style>
.table-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

tr:hover {
  background: #f9fafb;
}

.muted {
  color: var(--muted);
  font-size: 12px;
}

.empty {
  padding: 24px;
  text-align: center;
  color: var(--muted);
}
</style>
