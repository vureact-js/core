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

/**
 * Transforms a Vue AST descriptor into a React IR (Intermediate Representation) descriptor.
 *
 * This function orchestrates the transformation pipeline by processing both template and script ASTs
 * through their respective transformers and plugins. It ensures proper context setup and logs output
 * regardless of success or failure.
 *
 * @param ast - The Vue AST descriptor containing template and script information to be transformed
 * @returns A ReactIRDescriptor containing the transformed template and script intermediate representations
 *
 * @example
 *
 * const vueAST = parse(source);
 * const reactIR = transform(vueAST);
 * console.log(reactIR.template, reactIR.script);
 */
export function transform(ast: VueASTDescriptor): ReactIRDescriptor {
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
