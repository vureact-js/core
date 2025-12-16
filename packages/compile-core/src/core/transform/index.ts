import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { VueASTDescriptor } from '../parse';
import { ScriptBlockIR, transformScript } from './script';
import { TemplateBlockIR, transformRoot } from './template';

export interface ReactIRDescriptor {
  template: TemplateBlockIR | null;
  script: ScriptBlockIR | null;
}

export function transform(vueDescriptor: VueASTDescriptor): ReactIRDescriptor {
  const scriptLang = vueDescriptor.script?.source?.lang ?? 'js';
  const styleLangs = vueDescriptor.styles.map((s) => s.lang ?? 'css');

  compileContext.setContext({
    ...vueDescriptor.meta,
    lang: {
      script: scriptLang as 'js',
      style: styleLangs,
    },
  });

  const template = transformRoot(vueDescriptor.template?.ast);
  const script = transformScript(vueDescriptor.script?.ast);

  const descriptor: ReactIRDescriptor = {
    template,
    script,
  };

  // todo 阶段完成后移除
  if (logger.getLogs().length) {
    logger.printAll();
  }

  return descriptor;
}
