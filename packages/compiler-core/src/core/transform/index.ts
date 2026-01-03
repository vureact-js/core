import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { LangType } from '@src/shared/babel-utils';
import { VueASTDescriptor } from '../parse';
import { ScriptBlockIR, transformScript } from './script';
import { TemplateBlockIR, transformTemplate } from './template';

export interface ReactIRDescriptor {
  template: TemplateBlockIR | null;
  script: ScriptBlockIR | null;
}

/** 核心转换函数类型 */
export type Transformer<Source, IR> = (ast?: Source) => IR | null;

/** 后处理插件函数类型 */
export type TransformPlugin<IR> = (ir: IR) => IR;

interface PipelineOptions<Source, IR> {
  transformer: Transformer<Source, IR>;
  plugins?: TransformPlugin<IR>[];
}

export function transform(ast: VueASTDescriptor): ReactIRDescriptor {
  setupContext(ast);

  try {
    const templateIR = runPipeline(ast.template?.ast, {
      transformer: transformTemplate,
      plugins: [], // 未来可在此注入 template 级别的后处理插件
    });

    const scriptIR = runPipeline(ast.script?.ast, {
      transformer: transformScript,
      plugins: [], // 未来可在此注入 script 级别的后处理插件
    });

    return {
      template: templateIR,
      script: scriptIR,
    };
  } finally {
    // 确保日志在任何情况下都能输出（包括报错时）
    if (logger.getLogs().length) {
      logger.printAll();
    }
  }
}

/**
 * 初始化编译上下文
 */
function setupContext(ast: VueASTDescriptor) {
  const scriptLang = ast.script?.source?.lang ?? 'js';
  const styleLangs = ast.styles.map((s) => s.lang ?? 'css');

  compileContext.setContext({
    ...ast.meta,
    lang: {
      script: scriptLang as LangType,
      style: styleLangs,
    },
  });
}

/**
 * 通用管道执行器
 * 负责执行：Source -> Transform -> IR -> Plugins -> Final IR
 */
function runPipeline<Source, IR>(
  source: Source | undefined,
  options: PipelineOptions<Source, IR>,
): IR | null {
  const { transformer, plugins = [] } = options;

  // 1. 执行主转换
  let result = transformer(source);

  // 2. 如果转换成功，依次执行插件
  if (result && plugins.length) {
    result = plugins.reduce((acc, plugin) => plugin(acc) as any, result);
  }

  return result;
}
