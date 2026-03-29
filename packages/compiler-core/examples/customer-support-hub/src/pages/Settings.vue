<template>
  <section class="page">
    <PagePanel title="偏好与规则设置">
      <div class="form-grid">
        <label>
          首次响应时限（分钟）
          <input type="number" v-model.number="sla.firstResponseMinutes" />
        </label>
        <label>
          最终解决时限（分钟）
          <input type="number" v-model.number="sla.resolveMinutes" />
        </label>
        <label>
          预警阈值（%）
          <input type="number" v-model.number="sla.warningThresholdPercent" />
        </label>
        <label>
          表格密度
          <select v-model="density">
            <option value="default">默认</option>
            <option value="compact">紧凑</option>
          </select>
        </label>
      </div>

      <div class="actions">
        <AntButton type="primary" @click="save">保存设置</AntButton>
        <span v-if="saved">已保存</span>
      </div>
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SupportSettings
import { Button as AntButton } from 'antd';
import { ref } from 'vue';
import PagePanel from '../components/PagePanel.vue';
import { updateSlaConfig } from '../data/mock-api';
import { appStore } from '../store/useAppStore';

const state = appStore.getState();
const sla = ref({ ...state.slaConfig });
const density = ref(state.uiPrefs.density);
const saved = ref(false);

const save = async () => {
  await updateSlaConfig(sla.value);
  appStore.getState().setUiPrefs({ density: density.value });
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 1200);
};
</script>

<style scoped>
.page {
  display: grid;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

input,
select {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
}

.actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

span {
  color: var(--accent);
  font-size: 12px;
}
</style>
