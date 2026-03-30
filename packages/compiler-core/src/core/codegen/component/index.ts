import {
  generate as babelGenerator,
  GeneratorOptions as BabelGeneratorOptions,
} from '@babel/generator';
import { ParseResult as BabelParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { executePlugins } from '@shared/plugin-executor';
import { PluginRegister } from '@src/compiler';
import { ReactIRDescriptor } from '@transform/sfc';
import { buildJSX } from './jsx';
import { buildScript } from './script';

export interface GeneratorOptions extends BabelGeneratorOptions {
  plugins?: PluginRegister<GeneratorResult>;
}

export interface GeneratorResult {
  ast: t.Program | BabelParseResult;
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
 *
 * @returns 生成结果对象，包含 AST、生成的代码和原始源码引用
 */
export function generateComponent(
  ir: ReactIRDescriptor,
  ctx: ICompilationContext,
  options?: GeneratorOptions,
): GeneratorResult {
  const jsx = buildJSX(ir.template, ctx);
  const ast = buildScript(ir.script, ctx, jsx);

  const { code } = babelGenerator(ast, {
    // 配置 jsesc 避免 Unicode 转义
    jsescOption: {
      minimal: true, // 只转义必要的字符
      quotes: 'single', // 使用单引号
    },
    minified: true,
    ...options,
  });

  const result: GeneratorResult = {
    ast,
    code,
    source: ctx.source,
  };

  executePlugins(options?.plugins, result, ctx);

  return result;
}
