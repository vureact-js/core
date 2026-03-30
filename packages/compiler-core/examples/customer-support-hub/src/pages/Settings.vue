<template>
  <section class="page-grid">
    <PagePanel title="偏好与规则设置">
      <AntForm layout="vertical">
        <AntRow :gutter="[12, 0]">
          <AntCol :xs="24" :md="12">
            <AntFormItem label="首次响应时限（分钟）">
              <AntInputNumber :value="sla.firstResponseMinutes" :min="5" :max="360" style="width: 100%" @change="onFirstResponse" />
            </AntFormItem>
          </AntCol>

          <AntCol :xs="24" :md="12">
            <AntFormItem label="最终解决时限（分钟）">
              <AntInputNumber :value="sla.resolveMinutes" :min="30" :max="1440" style="width: 100%" @change="onResolve" />
            </AntFormItem>
          </AntCol>

          <AntCol :xs="24" :md="12">
            <AntFormItem label="预警阈值（%）">
              <AntInputNumber :value="sla.warningThresholdPercent" :min="1" :max="100" style="width: 100%" @change="onThreshold" />
            </AntFormItem>
          </AntCol>

          <AntCol :xs="24" :md="12">
            <AntFormItem label="表格密度">
              <AntRadioGroup :value="density" @change="onDensity">
                <AntRadioButton value="default">默认</AntRadioButton>
                <AntRadioButton value="compact">紧凑</AntRadioButton>
              </AntRadioGroup>
            </AntFormItem>
          </AntCol>

          <AntCol :xs="24" :md="12">
            <AntFormItem label="主题风格">
              <AntRadioGroup :value="theme" @change="onTheme">
                <AntRadioButton value="ocean">企业蓝灰</AntRadioButton>
                <AntRadioButton value="graphite">石墨灰</AntRadioButton>
              </AntRadioGroup>
            </AntFormItem>
          </AntCol>
        </AntRow>
      </AntForm>

      <AntSpace>
        <AntButton type="primary" :loading="saving" @click="save">保存设置</AntButton>
        <AntTypographyText type="success" v-if="saved">已保存</AntTypographyText>
      </AntSpace>
    </PagePanel>
  </section>
</template>

<script setup lang="ts">
// @vr-name: SupportSettings
import {
  Button as AntButton,
  Col as AntCol,
  Form as AntForm,
  InputNumber as AntInputNumber,
  Radio as AntRadio,
  Row as AntRow,
  Space as AntSpace,
  Typography as AntTypography,
  message,
} from 'antd';
import { ref } from 'vue';
import PagePanel from '../components/PagePanel.vue';
import { updateSlaConfig } from '../data/mock-api';
import { appStore } from '../store/useAppStore';

const AntFormItem = (AntForm as any).Item;
const AntRadioGroup = (AntRadio as any).Group;
const AntRadioButton = (AntRadio as any).Button;
const AntTypographyText = (AntTypography as any).Text;

const state = appStore.getState();
const sla = ref({ ...state.slaConfig });
const density = ref(state.uiPrefs.density);
const theme = ref(state.uiPrefs.theme);
const saving = ref(false);
const saved = ref(false);

const onFirstResponse = (value: any) => {
  sla.value.firstResponseMinutes = value || 30;
};

const onResolve = (value: any) => {
  sla.value.resolveMinutes = value || 240;
};

const onThreshold = (value: any) => {
  sla.value.warningThresholdPercent = value || 80;
};

const onDensity = (event: any) => {
  density.value = event?.target?.value || 'default';
};

const onTheme = (event: any) => {
  theme.value = event?.target?.value || 'ocean';
};

const save = async () => {
  saving.value = true;
  saved.value = false;

  try {
    await updateSlaConfig(sla.value);
    appStore.getState().setUiPrefs({ density: density.value, theme: theme.value });
    saved.value = true;
    message.success('设置已保存');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.page-grid {
  display: grid;
}
</style>
