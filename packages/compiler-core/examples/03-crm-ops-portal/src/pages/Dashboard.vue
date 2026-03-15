<template>
  <section class="page-section">
    <ThemeCard title="运营摘要" hint="本月关键指标与动态">
      <p>当前阶段聚焦：线索转化与客户回访。</p>
    </ThemeCard>

    <div class="kpi-grid">
      <KpiCard
        v-for="kpi in kpis"
        :key="kpi.title"
        :title="kpi.title"
        :value="kpi.value"
        :delta="kpi.delta"
        :trend="kpi.trend"
      />
    </div>

    <section class="panel">
      <header class="panel-header">
        <h3>最新动态</h3>
        <StatusPill label="今日" variant="info" />
      </header>
      <ul v-if="activities.length" class="activity-list">
        <li v-for="item in activities" :key="item.id">
          <strong>{{ item.who }}</strong> {{ item.action }} {{ item.target }}
          <span class="time">{{ item.time }}</span>
        </li>
      </ul>
      <div v-else class="empty">暂无动态</div>
    </section>
  </section>
</template>

<script setup lang="ts">
// @vr-name: Dashboard
import KpiCard from '../components/KpiCard.vue';
import ThemeCard from '../components/ThemeCard.vue';
import StatusPill from '../components/StatusPill.vue';
import { kpis, activities } from '../data/mock';
</script>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.panel {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-list {
  margin: 12px 0 0;
  display: grid;
  gap: 8px;
}

.time {
  color: var(--muted);
  margin-left: 8px;
}

.empty {
  margin-top: 12px;
  color: var(--muted);
}
</style>
