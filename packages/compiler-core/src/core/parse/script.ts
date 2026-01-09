import { parse as babelParse } from '@babel/parser';
import { getBabelParseOptions } from '@shared/babel-utils';
import { SFCScriptBlock } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';

export function parseScript(
  block: SFCScriptBlock | null,
  filename?: string,
): VueASTDescriptor['script'] {
  if (!block) return null;

  const options = getBabelParseOptions(
    block.lang as 'js',
    'vueTemplate',
    filename || 'anonymous.vue',
  );

  return {
    source: block,
    ast: babelParse(block.content, options),
  };
}
