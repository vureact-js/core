<template>
  <AntCard size="small" :title="props.item.title" variant="borderless">
    <template #extra>
      <AntTypographyText type="secondary">更新于 {{ props.item.updatedAt }}</AntTypographyText>
    </template>

    <AntSpace wrap>
      <AntTag v-for="tag in props.item.tags" :key="tag" color="blue">{{ tag }}</AntTag>
    </AntSpace>

    <AntTypographyParagraph style="margin-top: 10px; margin-bottom: 0">
      {{ props.item.content }}
    </AntTypographyParagraph>
  </AntCard>
</template>

<script setup lang="ts">
// @vr-name: KnowledgeCard
import {
  Card as AntCard,
  Space as AntSpace,
  Tag as AntTag,
  Typography as AntTypography,
} from 'antd';

const AntTypographyText = (AntTypography as any).Text;
const AntTypographyParagraph = (AntTypography as any).Paragraph;

const props = defineProps<{
  item: { id: string; title: string; tags: string[]; updatedAt: string; content: string };
}>();
</script>
