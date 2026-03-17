<template>
  <section class="page-section">
    <ThemeCard title="运营摘要" hint="本月关键指标与动态">
      <div class="summary">
        <div>
          <p class="summary-title">本周重点</p>
          <p class="summary-text">聚焦线索转化与客户续约，提升高价值客户的回访频次。</p>
        </div>
        <div class="summary-actions">
          <button class="primary ghost" @click="previewPlan">查看本周计划</button>
          <button class="primary" @click="createChecklist">创建跟进清单</button>
        </div>
      </div>
      <div v-if="actionNotice" class="notice">{{ actionNotice }}</div>
    </ThemeCard>

    <div class="kpi-grid">
      <KpiCard
        v-for="kpi in kpis"
        :key="kpi.title"
        :title="kpi.title"
        :value="kpi.value"
        :delta="kpi.delta"
        :trend="kpi.trend"
        :sub="kpi.sub"
      />
    </div>

    <div class="overview-grid">
      <section class="panel">
        <header class="panel-header">
          <h3>线索管道概览</h3>
          <div class="panel-meta">合计 {{ totalValue }} · {{ leads.length }} 条</div>
        </header>
        <div class="stage-grid">
          <div v-for="stage in stageSummary" :key="stage.key" class="stage-card">
            <div>
              <strong>{{ stage.label }}</strong>
              <p class="muted">{{ stage.count }} 条 · {{ stage.value }}</p>
            </div>
            <StatusPill :label="stage.highlight" :variant="stage.variant" />
          </div>
        </div>
      </section>

      <section class="panel">
        <header class="panel-header">
          <h3>重点提醒</h3>
          <StatusPill label="SLA" variant="warning" />
        </header>
        <ul class="alert-list">
          <li v-for="alert in alerts" :key="alert.id" class="alert-item">
            <div>
              <strong>{{ alert.title }}</strong>
              <p class="muted">{{ alert.detail }}</p>
              <p class="meta">责任人：{{ alert.owner }} · 截止 {{ alert.deadline }}</p>
            </div>
            <StatusPill :label="alert.level" :variant="alert.level" />
          </li>
        </ul>
      </section>
    </div>

    <div class="overview-grid">
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

      <section class="panel">
        <header class="panel-header">
          <h3>团队负载</h3>
          <StatusPill label="本周" variant="info" />
        </header>
        <div class="team-grid">
          <div v-for="member in teamLoad" :key="member.id" class="team-card">
            <div>
              <strong>{{ member.name }}</strong>
              <p class="muted">{{ member.role }}</p>
            </div>
            <div class="team-metrics">
              <span>线索 {{ member.leads }}</span>
              <span>任务 {{ member.tasks }}</span>
              <span>SLA {{ member.sla }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: Dashboard
import { computed, onMounted, ref } from 'vue';
import KpiCard from '../components/KpiCard.vue';
import StatusPill from '../components/StatusPill.vue';
import ThemeCard from '../components/ThemeCard.vue';
import { addActivity, fetchDashboard } from '../data/mock-api';

type DashboardData = Awaited<ReturnType<typeof fetchDashboard>>;

type Lead = DashboardData['leads'][0];
type Stage = DashboardData['stages'][0];

type Kpi = DashboardData['kpis'][0];
type Activity = DashboardData['activities'][0];
type Alert = DashboardData['alerts'][0];
type TeamMember = DashboardData['teamLoad'][0];

const kpis = ref<Kpi[]>([]);
const activities = ref<Activity[]>([]);
const alerts = ref<Alert[]>([]);
const teamLoad = ref<TeamMember[]>([]);
const leads = ref<Lead[]>([]);
const stages = ref<Stage[]>([]);

const actionNotice = ref('');

const totalValue = computed(() => {
  const sum = leads.value.reduce((acc, item) => acc + item.value, 0);
  return `¥ ${sum} 万`;
});

const stageSummary = computed(() => {
  return stages.value.map((stage) => {
    const items = leads.value.filter((lead) => lead.stage === stage.key);
    const value = items.reduce((acc, item) => acc + item.value, 0);
    const hot = items.filter((item) => item.daysInStage > 5).length;
    const highlight = hot ? `${hot} 条超 5 天` : '稳定';
    const variant = hot ? 'warning' : 'success';
    return {
      key: stage.key,
      label: stage.label,
      count: items.length,
      value: `¥ ${value} 万`,
      highlight,
      variant,
    };
  });
});

const previewPlan = async () => {
  actionNotice.value = '已生成本周计划，正在同步给团队。';
  await addActivity({ who: '系统', action: '生成了本周计划', target: '运营节奏' });
  setTimeout(() => {
    actionNotice.value = '';
  }, 2000);
};

const createChecklist = async () => {
  actionNotice.value = '已创建跟进清单，线索负责人将收到提醒。';
  await addActivity({ who: '系统', action: '创建跟进清单', target: '高风险线索' });
  setTimeout(() => {
    actionNotice.value = '';
  }, 2000);
};

onMounted(async () => {
  const data = await fetchDashboard();
  kpis.value = data.kpis;
  activities.value = data.activities;
  alerts.value = data.alerts;
  teamLoad.value = data.teamLoad;
  leads.value = data.leads;
  stages.value = data.stages;
});
</script>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.summary-title {
  margin: 0 0 6px;
  font-weight: 600;
}

.summary-text {
  margin: 0;
  color: var(--muted);
}

.summary-actions {
  display: flex;
  gap: 8px;
}

.notice {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--banner);
  font-size: 12px;
}

.primary {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
}

.primary.ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
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
  margin-bottom: 12px;
}

.panel-meta {
  font-size: 12px;
  color: var(--muted);
}

.stage-grid {
  display: grid;
  gap: 10px;
}

.stage-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.alert-list {
  display: grid;
  gap: 12px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
}

.meta {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 12px;
}

.activity-list {
  margin: 0;
  display: grid;
  gap: 8px;
}

.time {
  color: var(--muted);
  margin-left: 8px;
}

.team-grid {
  display: grid;
  gap: 10px;
}

.team-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
}

.team-metrics {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}

.muted {
  color: var(--muted);
}

.empty {
  margin-top: 12px;
  color: var(--muted);
}

@media (max-width: 980px) {
  .summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-actions {
    width: 100%;
  }
}
</style>
