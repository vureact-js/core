import { baseParse as vueBaseParse } from '@vue/compiler-core';
import { SFCTemplateBlock } from '@vue/compiler-sfc';
import { ParseResult } from '.';

export function parseTemplate(block: SFCTemplateBlock | null): ParseResult['template'] {
  if (!block?.content) return null;

  return {
    ast: vueBaseParse(block.content, {
      onError() {},
    }),
  };
}
