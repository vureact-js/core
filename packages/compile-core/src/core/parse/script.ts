import { parse as babelParse } from '@babel/parser';
import { getBabelParseOptions } from '@shared/babel-utils';
import { SFCScriptBlock } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';

export function parseScript(block: SFCScriptBlock | null): VueASTDescriptor['script'] {
  if (!block) return null;

  const babelParseOpts = getBabelParseOptions(block.lang as 'js', 'vueTemplate', '');
  const ast = babelParse(block.content, babelParseOpts);

  return {
    source: block,
    ast,
  };
}
