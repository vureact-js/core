import { logger } from '@shared/logger';
import { VueASTDescriptor } from '../parse';
import { clearContext, getContext, setContext, TransformContext } from './context';
import { TemplateBlockIR, transformTemplate } from './template';

export interface ReactIRDescriptor extends TransformContext {
  template: TemplateBlockIR | null;
}

export function transform(vueDescriptor: VueASTDescriptor): ReactIRDescriptor {
  const scriptLang = vueDescriptor.script?.source?.lang ?? 'js';
  const styleLangs = vueDescriptor.styles.map((s) => s.lang ?? 'css');

  setContext({
    ...vueDescriptor.meta,
    lang: {
      script: scriptLang,
      style: styleLangs,
    },
  });

  const template = transformTemplate(vueDescriptor.template?.ast);

  const descriptor: ReactIRDescriptor = {
    template,
    ...getContext(),
  };

  // todo 阶段完成后移除
  if (logger.getLogs().length) {
    logger.printAll();
  }

  clearContext();

  return descriptor;
}
