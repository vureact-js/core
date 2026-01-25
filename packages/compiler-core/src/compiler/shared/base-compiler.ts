import { GeneratorOptions } from '@babel/generator';
import { logger } from '@shared/logger';
import { generate, parse, transform } from '@src/core';
import { version as pkgVersion } from '../../../package.json';
import { createCompilationCtx } from '../context';
import { Helper } from './helper';
import { CompileResult, CompilerOptions } from './types';

/**
 * Basic core compilation: compile Vue code to React code only,
 * no file system handling included.
 */
export class BaseCompiler extends Helper {
  protected options: CompilerOptions;

  version = pkgVersion;

  constructor(options: CompilerOptions = {}) {
    super(options);
    this.options = options;
  }

  /**
   * Compiles Vue source code into React code.
   *
   * @param source - The Vue source code string to compile
   * @param filename - Filename with path or only filename
   * @returns {CompileResult} The compilation result containing generated react component code and metadata
   * @throws Will not throw, errors are caught and log
   *
   * @example
   * ```ts
   * const result = compiler.compile('<template><div>Hello</div></template>', 'App.vue');
   * ```
   */
  compile(source: string, filename = 'anonymous.vue'): CompileResult {
    const { logging } = this.options;

    // 创建编译上下文
    const ctx = createCompilationCtx();

    ctx.init({ source, filename });

    try {
      const ast = parse(source, ctx.data);
      const ir = transform(ast, ctx.data);
      const result = generate(ir, ctx.data, this.prepareGenerateOptions(filename));

      const { lang } = ctx.data.scriptData;

      const outputPath = this.resolveOutputPath(filename, lang);

      return { file: outputPath, lang, ...result };
    } finally {
      // 打印三个核心模块处理过程中收集的日志消息
      if (logging?.enabled !== false && logger.getLogs().length) {
        logger.printAll(logging);
      }

      // 编译结束后清理上下文
      ctx.clear();
    }
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
