import {
  generate as babelGenerator,
  GeneratorOptions as BabelGeneratorOptions,
} from '@babel/generator';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ReactIRDescriptor } from '@core/transform';
import { executePlugins } from '@shared/plugin-executor';
import { PluginRegister } from '@src/compiler';
import { buildJSX } from './jsx';
import { buildScript } from './script';

export interface GeneratorOptions extends BabelGeneratorOptions {
  plugins?: PluginRegister<GeneratorResult>;
}

export interface GeneratorResult {
  ast: t.Program;
  code: string;
  source: string;
}

/**
 * 将 React 中间表示（IR）生成为可执行的 JSX/TSX 代码。
 *
 * 此函数是代码生成阶段的核心入口，负责将转换后的 React IR 转换为
 * 完整的 AST 并最终生成源代码。生成过程包括 JSX 构建和脚本构建。
 *
 * @param ir - React 中间表示描述符，来自 {@link transform} 函数的返回值
 * @param ctx - 编译上下文对象
 * @param options - 可选的生成选项，包括 Babel 生成器选项和插件
 * @returns 生成结果对象，包含 AST、生成的代码和原始源码引用
 *
 * @remarks
 * - JSX 构建：将模板 IR 转换为 JSX AST 节点
 * - 脚本构建：将脚本 IR 与 JSX 结合，构建完整的程序 AST
 * - 代码生成：使用 Babel 生成器将 AST 转换为源代码字符串
 * - 插件支持：支持通过插件对生成结果进行自定义处理
 *
 * @example
 * ```typescript
 * // 生成示例
 *
 * const ctx: ICompilationContext = {
 *   filename: 'MyComponent.vue',
 *   source: vueSource,
 *   // 其他上下文配置...
 * };
 *
 * // 1. 解析 Vue SFC
 * const parseResult = parse(vueSource, ctx);
 *
 * // 2. 转换为 React IR
 * const reactIR = transform(parseResult, ctx);
 *
 * // 使用可选配置项进行自定义处理
 * const generatorOptions: GeneratorOptions = {
 *   // 配置 jsesc 避免 Unicode 转义
 *   jsescOption: {
 *     minimal: true,
 *     quotes: 'single'
 *   },
 *   minified: true,
 *
 *   // 自定义插件
 *   plugins: {
 *     // 插件1：代码格式化
 *     formatCode: (result, ctx) => {
 *       // 使用 prettier 格式化生成的代码
 *       result.code = prettier.format(result.code, {
 *         parser: 'babel',
 *         semi: true,
 *         singleQuote: true,
 *       });
 *     },
 *
 *     // 插件2：代码质量检查
 *     lintGeneratedCode: (result, ctx) => {
 *       const issues = eslint.verify(result.code, {
 *         rules: {
 *           'react/react-in-jsx-scope': 'off',
 *           'no-unused-vars': 'warn',
 *         },
 *       });
 *
 *       if (issues.length > 0) {
 *         result.lintIssues = issues;
 *         console.warn(`Found ${issues.length} lint issues in generated code`);
 *       }
 *     },
 *   },
 * };
 *
 * // 3. 生成 React 代码
 * const generated = generate(reactIR, ctx, generatorOptions);
 *
 * // 访问生成结果
 * console.log(generated.ast);   // 完整的 Babel AST
 * console.log(generated.code);  // 生成的源代码
 * console.log(generated.source); // 原始 Vue 源码
 * ```
 */
export function generate(
  ir: ReactIRDescriptor,
  ctx: ICompilationContext,
  options?: GeneratorOptions,
): GeneratorResult {
  const jsx = buildJSX(ir.template, ctx);
  const ast = buildScript(ir.script, ctx, jsx);
  const { code } = babelGenerator(ast, options);

  const result: GeneratorResult = {
    ast,
    code,
    source: ctx.source,
  };

  executePlugins(options?.plugins, result, ctx);

  return result;
}
