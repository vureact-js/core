import { ICompilationContext } from '@compiler/context/types';
import { VueASTDescriptor } from '../parse';
import { ScriptBlockIR, transformScript } from './script';
import { TemplateBlockIR, transformTemplate } from './template';

export interface ReactIRDescriptor {
  template: TemplateBlockIR | null;
  script: ScriptBlockIR | null;
  style?: string;
}

interface PipelineOptions<A, IR = ReactIR> {
  type: 'template' | 'script';
  transformer: Transformer<A, IR>;
  plugins?: TransformPlugin<IR>[];
}

export type Transformer<A, IR = ReactIR> = (ctx: ICompilationContext, ast: A) => IR | null;

export type TransformPlugin<IR = ReactIR> = (ctx: ICompilationContext, ast: IR) => IR;

type ReactIR = TemplateBlockIR | ScriptBlockIR;

/**
 * Transforms a Vue AST descriptor into a React IR (Intermediate Representation) descriptor.
 *
 * This function orchestrates the transformation pipeline by processing both template and script ASTs
 * through their respective transformers and plugins. It ensures proper context setup and logs output
 * regardless of success or failure.
 *
 * @param {VueASTDescriptor} ast - The Vue AST descriptor containing template and script information to be transformed
 * @param {ICompilationContext} ctx - Compilation context
 * @returns A ReactIRDescriptor containing the transformed template and script intermediate representations
 *
 * @example
 *
 * const vueAST = parse(source);
 * const reactIR = transform(vueAST);
 * console.log(reactIR.template, reactIR.script);
 */
export function transform(ast: VueASTDescriptor, ctx: ICompilationContext): ReactIRDescriptor {
  const templateIR = runPipeline(ctx, ast.template?.ast, {
    type: 'template',
    transformer: transformTemplate,
    plugins: [], // 未来可在此注入 template 级别的后处理插件
  });

  const scriptIR = runPipeline(ctx, ast.script?.ast, {
    type: 'script',
    transformer: transformScript,
    plugins: [], // 未来可在此注入 script 级别的后处理插件
  });

  return {
    template: templateIR,
    script: scriptIR,
    style: ast.style?.source?.content,
  };
}

/**
 * 通用管道执行器
 * 负责执行：Source -> Transform -> IR -> Plugins -> Final IR
 */
function runPipeline<A, IR = ReactIR>(
  ctx: ICompilationContext,
  ast: A | undefined,
  options: PipelineOptions<A, IR>,
): IR | null {
  const { type, transformer, plugins = [] } = options;

  // 允许 script 转换器接收 undefined
  if (!ast && type !== 'script') {
    return null;
  }

  // 1. 执行主转换
  let result = transformer(ctx, ast as A);

  // 2. 如果转换成功，依次执行插件
  if (result && plugins.length) {
    result = plugins.reduce((ir, plugin) => plugin(ctx, ir) as any, result);
  }

  return result;
}
