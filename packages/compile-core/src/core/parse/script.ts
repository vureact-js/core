import { ParserPlugin, parse as scriptParse } from '@babel/parser';
import { SFCScriptBlock } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';

export function parseScript(block: SFCScriptBlock | null): VueASTDescriptor['script'] {
  if (!block) return null;

  const getLang = (): ParserPlugin[] => {
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
    ast: scriptParse(block.content, { sourceType: 'module', plugins: [...getLang()] }),
  };
}
