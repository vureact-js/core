import { SFCDescriptor } from '@vue/compiler-sfc';
import { VueASTDescriptor } from '.';
import { parseScript } from './parseScript';
import { parseStyles } from './parseStyles';
import { parseTemplate } from './parseTemplate';

export function parseSFCDescriptor(descriptor: SFCDescriptor): VueASTDescriptor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { template, script, scriptSetup, styles, source, ...meta } = descriptor;

  return {
    template: parseTemplate(template),
    script: parseScript(script || scriptSetup),
    styles: parseStyles(styles),
    meta: meta as VueASTDescriptor['meta'],
  };
}
