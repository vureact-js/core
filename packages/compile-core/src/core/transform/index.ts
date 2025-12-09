import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { VueASTDescriptor } from '../parse';
import { TemplateBlockIR, transformTemplate } from './template';

export interface ReactIRDescriptor {
  template: TemplateBlockIR | null;
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

  const template = transformTemplate(vueDescriptor.template?.ast);

  const descriptor: ReactIRDescriptor = {
    template,
  };

  // todo 阶段完成后移除
  if (logger.getLogs().length) {
    logger.printAll();
  }

  return descriptor;
}
