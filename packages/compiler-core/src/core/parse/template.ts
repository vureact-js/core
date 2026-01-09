import { baseParse as vueBaseParse } from '@vue/compiler-core';
import { SFCTemplateBlock } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';

export function parseTemplate(block: SFCTemplateBlock | null): VueASTDescriptor['template'] {
  if (!block?.content) return null;

  return {
    ast: vueBaseParse(block.content, {
      onError() {},
    }),
  };
}
