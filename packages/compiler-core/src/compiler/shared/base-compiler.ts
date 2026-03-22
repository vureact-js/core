import { GeneratorOptions } from '@babel/generator';
import {
  generate,
  GeneratorResult,
  parse,
  ParseResult,
  ReactIRDescriptor,
  transform,
} from '@core/index';
import { parseOnlyStyle } from '@parse/style-only';
import { executePlugins } from '@shared/plugin-executor';
import { version as pkgVersion } from '../../../package.json';
import { CompilationAdapter } from '../context/adapter';
import { ICompilationContext } from '../context/types';
import { Helper } from './helper';
import {
  BaseCompilationResult,
  CompilationResult,
  CompilerOptions,
  ScriptCompilationResult,
  SFCCompilationResult,
  StyleCompilationResult,
} from './types';

/**
 * 基础编译器类 - Vue 到 React 代码转换的核心实现
 *
 * 继承自 Helper，提供单文件编译功能，支持插件系统和三阶段编译流程。
 * 主要用于文件系统批量编译和单文件编译场景。
 */
export class BaseCompiler extends Helper {
  version = pkgVersion;
  options: CompilerOptions;
  private createContext = CompilationAdapter.createContext;

  constructor(options: CompilerOptions = {}) {
    super(options);
    this.options = options;
  }

  /** 编译 Vue 源代码为 React 代码 */
  compile(source: string, filename: string): CompilationResult {
    const { plugins, preprocessStyles = true } = this.options;
    const fileId = this.genHash(filename);

    const ctx = this.createContext({
      fileId,
      filename,
      source,
      preprocessStyles,
    });

    const genOptions = this.prepareGenerateOptions(filename);

    const resolveSFCAndScriptFile = () => {
      const ast = parse(source, ctx.data, { plugins: plugins?.parser });
      const ir = transform(ast, ctx.data, { plugins: plugins?.transformer });
      const gen = generate(ir, ctx.data, {
        ...genOptions,
        plugins: plugins?.codegen,
      });

      return this.resolveMainResult(ir, gen, ctx.data);
    };

    const resolveStyleFile = () => {
      const result = parseOnlyStyle(source, ctx.data, { plugins: plugins?.parser });
      return this.resolveStyleResult(result, ctx.data);
    };

    try {
      const isStyleFile = ctx.data.inputType === 'style';
      const result = isStyleFile ? resolveStyleFile() : resolveSFCAndScriptFile();

      if (plugins) {
        const { parser, transformer, codegen, ...rest } = plugins;
        executePlugins(rest, result, ctx);
      }

      return result;
    } finally {
      ctx.clear();
    }
  }

  private prepareGenerateOptions(filename?: string): GeneratorOptions {
    const userOptions = this.options.generate || {};

    const mergedOptions: GeneratorOptions = {
      jsescOption: {
        minimal: true,
        quotes: 'single',
      },
      minified: true,
      ...userOptions,
    };

    if (mergedOptions.sourceMaps && filename) {
      mergedOptions.sourceFileName = mergedOptions.sourceFileName || filename;
    }

    return mergedOptions;
  }

  private resolveMainResult(
    ir: ReactIRDescriptor,
    gen: GeneratorResult,
    ctxData: ICompilationContext,
  ): SFCCompilationResult | ScriptCompilationResult {
    const { fileId, filename, scriptData, styleData, inputType } = ctxData;

    const base: BaseCompilationResult = {
      fileId,
      hasRoute: ctxData.route,
      ...gen,
    };

    const { lang } = scriptData;
    const file = this.resolveOutputPath(filename, lang);

    if (inputType === 'sfc') {
      return {
        fileInfo: {
          jsx: {
            file: `${file}x`,
            lang,
          },
          css: {
            file: styleData?.filePath,
            hash: styleData?.scopeId,
            code: ir?.style,
          },
        },
        ...base,
      } as SFCCompilationResult;
    }

    return {
      fileInfo: { script: { file, lang } },
      ...base,
    } as ScriptCompilationResult;
  }

  private resolveStyleResult(
    data: ParseResult,
    ctxData: ICompilationContext,
  ): StyleCompilationResult {
    const { fileId, filename } = ctxData;
    const { lang, content = '' } = data.style!.source!;

    const file = this.resolveOutputPath(filename, lang!);

    return {
      fileId,
      fileInfo: {
        style: {
          file,
          lang: lang!,
        },
      },
      code: content,
    };
  }
}
