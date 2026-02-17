import { GeneratorOptions } from '@babel/generator';
import { logger } from '@shared/logger';
import { executePlugins } from '@shared/plugin-executor';
import { generate, GeneratorResult, parse, ReactIRDescriptor, transform } from '@src/core';
import { version as pkgVersion } from '../../../package.json';
import { CompilationAdapter } from '../context/adapter';
import { ICompilationContext } from '../context/types';
import { Helper } from './helper';
import {
  CompilationResult,
  CompilerOptions,
  ScriptCompilationResult,
  SFCCompilationResult,
} from './types';

/**
 * 基础编译器类，提供 Vue 到 React 代码转换的核心编译功能。
 *
 * 此类继承自 {@link Helper}，是编译器的核心实现，负责：
 * 1. 初始化编译上下文
 * 2. 执行完整的编译流程（解析 → 转换 → 生成）
 * 3. 管理编译选项和配置
 * 4. 处理编译过程中的日志和错误
 *
 * 主要供 {@link FileCompiler} 继承使用，也可以直接实例化用于单文件编译。
 *
 * @remarks
 * - 编译流程：使用 {@link parse}、{@link transform}、{@link generate} 三个核心函数
 * - 上下文管理：每次编译创建独立的编译上下文，编译结束后自动清理
 * - 错误处理：编译错误不会抛出，而是通过日志系统记录
 * - 配置继承：继承 Helper 类的文件路径处理、缓存管理等工具方法
 *
 * @see {@link FileCompiler} 用于文件系统级别的批量编译
 * @see {@link Helper} 提供基础的工具方法
 */
export class BaseCompiler extends Helper {
  version = pkgVersion;
  protected options: CompilerOptions;
  private createContext = CompilationAdapter.createContext;

  constructor(options: CompilerOptions = {}) {
    super(options);
    this.options = options;
  }

  compile(source: string, filename: string): CompilationResult {
    const { plugins, logging } = this.options;

    const fileId = this.genHash(filename);
    const genOptions = this.prepareGenerateOptions(filename);
    const ctx = this.createContext({
      fileId,
      filename,
      source,
    });

    try {
      const ast = parse(source, ctx.data, { plugins: plugins?.parser });
      const ir = transform(ast, ctx.data, { plugins: plugins?.transformer });
      const gen = generate(ir, ctx.data, {
        ...genOptions,
        plugins: plugins?.codegen,
      });

      const result = this.resolveResult(ir, gen, ctx.data);

      // 执行最终插件
      if (plugins) {
        const { parser, transformer, codegen, ...rest } = plugins;
        executePlugins(rest, result, ctx);
      }

      return result;
    } finally {
      if (logging?.enabled !== false && logger.getLogs().length) {
        logger.printAll(logging);
        logger.clear();
      }

      // 编译结束后清理上下文
      ctx.clear();
    }
  }

  /**
   * 处理 sfc / script 编译结果
   */
  private resolveResult(
    ir: ReactIRDescriptor,
    gen: GeneratorResult,
    ctxData: ICompilationContext,
  ): CompilationResult {
    const { fileId, filename, scriptData, styleData } = ctxData;
    const { lang } = scriptData;
    const file = this.resolveOutputPath(filename, lang);

    if (ctxData.inputType === 'sfc') {
      return {
        fileId,
        fileInfo: {
          jsx: {
            file: `${file}x`, // 'xxx.ts' + 'x' => 'xxx.tsx'
            lang,
          },
          css: {
            file: styleData?.filePath,
            hash: styleData?.scopeId,
            code: ir?.style,
          },
        },
        ...gen,
      } as SFCCompilationResult;
    }

    // script file
    return {
      fileId,
      fileInfo: { script: { file, lang } },
      ...gen,
    } as ScriptCompilationResult;
  }

  /**
   * 初始化 babel generate 选项
   */
  private prepareGenerateOptions(filename?: string): GeneratorOptions {
    const userOptions = this.options.generate || {};

    const mergedOptions: GeneratorOptions = {
      // 配置 jsesc 避免 Unicode 转义
      jsescOption: {
        minimal: true, // 只转义必要的字符
        quotes: 'single', // 使用单引号
      },
      minified: true,
      ...userOptions,
    };

    // 如果启用了源码映射，设置文件名
    if (mergedOptions.sourceMaps && filename) {
      mergedOptions.sourceFileName = mergedOptions.sourceFileName || filename;
    }

    return mergedOptions;
  }
}
