<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h2>线索管道</h2>
        <p class="muted">按阶段推进线索，跟踪金额与负责人。</p>
      </div>
      <button class="ghost" @click="reset">重置阶段</button>
    </header>

    <div class="pipeline">
      <PipelineStage
        v-for="stage in stages"
        :key="stage.key"
        :stage="{ ...stage, items: getItems(stage.key) }"
        @move="onMove"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// @vr-name: LeadsPipeline
import { ref } from 'vue';
import PipelineStage from '../components/PipelineStage.vue';
import { leads as seedLeads, stages } from '../data/mock';

type Lead = (typeof seedLeads)[0];

const leads = ref<Lead[]>([...seedLeads]);

function getItems(stageKey: string) {
  return leads.value.filter((lead) => lead.stage === stageKey);
}

const onMove = (payload: { id: string; stage: string }) => {
  const order = stages.map((stage) => stage.key);
  const index = order.indexOf(payload.stage);
  const nextStage = order[index + 1] ?? order[index];

  leads.value = leads.value.map((lead) =>
    lead.id === payload.id ? { ...lead, stage: nextStage } : lead,
  );
};

const reset = () => {
  leads.value = [...seedLeads];
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

.pipeline {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 1fr);
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.ghost {
  background: transparent;
  border: 1px solid var(--border);
  padding: 8px 14px;
  border-radius: 8px;
}

.muted {
  color: var(--muted);
}
</style>
