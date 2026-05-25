<template>
  <div class="note-composer">
    <div class="context-bar">
      <strong>内部协同备注</strong>
      <span v-if="ticketContext">关联工单：{{ ticketContext.ticketId.value }}</span>
    </div>

    <AntForm layout="vertical" class-name="note-form">
      <AntFormItem label="备注类型">
        <AntSelect :value="props.noteType" :options="noteTypeOptions" @change="onTypeChange" />
      </AntFormItem>

      <AntFormItem label="协同对象">
        <AntSelect
          mode="multiple"
          allow-clear
          :value="props.mentions"
          :options="mentionOptions"
          placeholder="选择需要同步的同学"
          @change="onMentionsChange"
        />
      </AntFormItem>

      <AntFormItem label="协同步骤">
        <AntCheckboxGroup :value="quickFlags" :options="flagOptions" @change="onFlagsChange" />
      </AntFormItem>

      <AntFormItem :validate-status="validateStatus" :help="helpText" label="备注内容">
        <AntInputTextArea
          :value="props.modelValue"
          :rows="5"
          placeholder="请写清影响范围、下一动作和负责人。"
          @change="onContentChange"
        />
      </AntFormItem>

      <div v-show="props.modelValue.length > 0" class="draft-hint">
        当前草稿 {{ props.modelValue.length }} 字，可先保存再继续补充。
      </div>

      <AntSpace wrap>
        <AntButton @click="onSaveDraft">保存草稿</AntButton>
        <AntButton type="primary" :disabled="!isValid" @click="onSubmit">提交备注</AntButton>
        <AntButton type="link" @click="resetDraft">清空</AntButton>
      </AntSpace>
    </AntForm>
  </div>
</template>

<script setup lang="ts">
import {
  Button as AntButton,
  Checkbox as AntCheckbox,
  Form as AntForm,
  Input as AntInput,
  Select as AntSelect,
  Space as AntSpace,
} from 'antd';
import { computed, inject, ref } from 'vue';
import { ticketCollabContextKey, type TicketCollabContext } from './conversation-context';

const AntFormItem = (AntForm as any).Item;
const AntInputTextArea = AntInput.TextArea;
const AntCheckboxGroup = AntCheckbox.Group;

const props = defineProps<{
  modelValue: string;
  noteType: 'sync' | 'risk' | 'follow-up';
  mentions: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:noteType', value: 'sync' | 'risk' | 'follow-up'): void;
  (e: 'update:mentions', value: string[]): void;
  (e: 'save-draft'): void;
  (e: 'submit'): void;
}>();

const ticketContext = inject<TicketCollabContext | null>(ticketCollabContextKey, null);
const quickFlags = ref<string[]>([]);

const noteTypeOptions = [
  { label: '同步', value: 'sync' },
  { label: '风险', value: 'risk' },
  { label: '跟进', value: 'follow-up' },
];

const flagOptions = [
  { label: '已同步研发', value: 'rd' },
  { label: '待客户确认', value: 'customer' },
  { label: '需值班升级', value: 'escalate' },
];

const mentionOptions = computed(() =>
  (ticketContext?.agents.value || []).map((name: string) => ({
    label: name,
    value: name,
  })),
);

const isValid = computed(() => props.modelValue.trim().length >= 10);
const validateStatus = computed(() => {
  if (!props.modelValue) return '';
  return isValid.value ? 'success' : 'warning';
});
const helpText = computed(() => {
  if (!props.modelValue) return '建议至少 10 个字，写清上下文和下一动作。';
  if (!isValid.value) return '备注过短，建议补充影响范围和责任人。';
  return '内容完整，可提交。';
});

const onTypeChange = (value: any) => emit('update:noteType', value || 'sync');
const onMentionsChange = (value: any) => emit('update:mentions', Array.isArray(value) ? value : []);
const onFlagsChange = (value: any) => {
  quickFlags.value = Array.isArray(value) ? value : [];
};
const onContentChange = (event: any) => emit('update:modelValue', event?.target?.value || '');
const onSaveDraft = () => emit('save-draft');
const onSubmit = () => {
  if (!isValid.value) return;
  emit('submit');
};

const resetDraft = () => {
  quickFlags.value = [];
  emit('update:modelValue', '');
  emit('update:mentions', []);
  emit('update:noteType', 'sync');
};

const focusEditor = () => {
  return;
};

defineExpose({
  focusEditor,
  resetDraft,
});
</script>

<style scoped>
.note-composer {
  display: grid;
  gap: 12px;
}

.context-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  color: #6b7280;
}

.draft-hint {
  color: #6b7280;
  font-size: 12px;
}
</style>
