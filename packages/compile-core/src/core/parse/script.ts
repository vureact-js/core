import { ParserPlugin, parse as babelParse } from '@babel/parser';
import { SFCScriptBlock } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';

export function parseScript(block: SFCScriptBlock | null): VueASTDescriptor['script'] {
  if (!block) return null;

  const plugins = (): ParserPlugin[] => {
    switch (block.lang) {
      case 'ts':
        return ['typescript'];

      case 'tsx':
        return ['typescript', 'jsx'];

      case 'jsx':
        return ['jsx'];

      default:
        return [];
    }
  };

  return {
    source: block,
    ast: babelParse(block.content, { sourceType: 'module', plugins: plugins() }),
  };
}
