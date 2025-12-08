import { SFCStyleBlock } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';

export function parseStyles(block: SFCStyleBlock[]): VueASTDescriptor['styles'] {
  return block;
}
