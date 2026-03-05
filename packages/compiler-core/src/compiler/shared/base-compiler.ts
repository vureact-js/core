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
 * 基础编译器类，提供 Vue 到 React 代码转换的核心编译功能。
 *
 * 此类继承自 {@link Helper}，是 VuReact 编译器的核心实现，负责：
 * 1. 初始化编译上下文：为每次编译创建独立的上下文环境
 * 2. 执行完整的编译流程：解析（parse）→ 转换（transform）→ 生成（generate）
 * 3. 管理编译选项和配置：处理用户传入的编译器配置
 * 4. 插件系统集成：支持解析、转换、生成各阶段的插件扩展
 * 5. 错误处理和日志记录：通过日志系统记录编译过程中的信息
 *
 * 主要用途：
 * - 供 {@link FileCompiler} 继承使用，实现文件系统级别的批量编译
 * - 直接实例化用于单文件编译，适合集成到其他工具链中
 *
 * 核心特性：
 * - 三阶段编译流水线：严格遵循解析→转换→生成的编译模型
 * - 插件化架构：支持在编译各阶段插入自定义逻辑
 * - 上下文隔离：每次编译创建独立上下文，避免状态污染
 * - 资源感知：自动处理样式预处理和路由依赖检测
 * - 错误恢复：编译错误通过日志记录，不会中断整个流程
 *
 * 编译流程详解：
 * 1. 解析阶段：使用 {@link parse} 将 Vue 代码解析为抽象语法树（AST）
 * 2. 转换阶段：使用 {@link transform} 将 Vue AST 转换为 React 中间表示（IR）
 * 3. 生成阶段：使用 {@link generate} 将 React IR 生成为目标代码
 * 4. 插件执行：在各阶段执行注册的插件，支持自定义扩展
 *
 * @example
 * ```typescript
 * // 创建基础编译器实例
 * const compiler = new BaseCompiler({
 *   cache: true,
 *   preprocessStyles: true,
 *   plugins: {
 *     parser: {
 *       myParserPlugin: (result, ctx) => {
 *         // 解析阶段插件
 *       }
 *     },
 *     transformer: {
 *       myTransformerPlugin: (result, ctx) => {
 *         // 转换阶段插件
 *       }
 *     }
 *   }
 * });
 *
 * // 编译单个 Vue 文件
 * const result = compiler.compile(vueSourceCode, '/path/to/Component.vue');
 *
 * // 获取编译结果
 * console.log(result.fileInfo); // 包含 JSX 和 CSS 文件信息
 * console.log(result.code);     // 生成的 React 代码
 * ```
 *
 * @remarks
 * - 上下文管理：使用 {@link CompilationAdapter.createContext} 创建编译上下文
 * - 错误处理：编译过程中的错误通过 {@link logger} 记录，不会抛出异常
 * - 配置继承：继承 {@link Helper} 类的文件路径处理、缓存管理、格式化等工具方法
 * - 版本管理：自动读取 package.json 中的版本号，便于调试和日志记录
 *
 * @see {@link FileCompiler} 用于文件系统级别的批量编译和增量构建
 * @see {@link Helper} 提供基础的文件路径处理、缓存管理和格式化工具
 * @see {@link CompilerOptions} 查看完整的编译器配置选项
 * @see {@link CompilationResult} 编译结果的数据结构
 */
export class BaseCompiler extends Helper {
  version = pkgVersion;
  options: CompilerOptions;
  private createContext = CompilationAdapter.createContext;

  /**
   * 创建基础编译器实例
   *
   * @param options - 编译器配置选项，包括缓存设置、插件配置、样式预处理等，
   * 所有选项都会传递给父类 {@link Helper} 进行初始化
   *
   * @see {@link CompilerOptions} 查看完整的配置选项说明
   */
  constructor(options: CompilerOptions = {}) {
    super(options);
    this.options = options;
  }

  /**
   * 编译 Vue 源代码为 React 代码
   *
   * 该方法执行完整的编译流程，包括：
   * 1. 上下文初始化：创建独立的编译上下文
   * 2. 解析阶段：将 Vue 源代码解析为抽象语法树（AST）
   * 3. 转换阶段：将 Vue AST 转换为 React 中间表示（IR）
   * 4. 生成阶段：将 React IR 生成为目标代码
   * 5. 插件执行：在各阶段执行注册的插件
   * 6. 结果处理：整理编译结果并返回
   *
   * 编译过程使用 try-finally 确保上下文资源被正确清理，
   * 即使编译过程中发生错误也不会导致资源泄漏。
   *
   * @param source - Vue 源代码字符串
   * @param filename - 源文件名，用于生成文件ID和输出路径
   * @returns {CompilationResult} 编译结果，包含生成的代码和文件信息
   *
   * @example
   * ```typescript
   * const vueCode = `
   * <template>
   *   <div class="container">{{ message }}</div>
   * </template>
   *
   * <script setup lang="ts">
   * import { ref } from 'vue;
   * const message = ref('Hello Vue')
   * </script>
   *
   * <style scoped>
   * .container {
   *   padding: 20px;
   * }
   * </style>
   * `;
   *
   * const result = compiler.compile(vueCode, 'MyComponent.vue');
   * console.log(result);
   * ```
   *
   * @throws 不会直接抛出异常，错误通过日志系统记录
   * @see {@link parse} 解析函数
   * @see {@link transform} 转换函数
   * @see {@link generate} 生成函数
   * @see {@link executePlugins} 插件执行函数
   */
  compile(source: string, filename: string): CompilationResult {
    const { plugins, preprocessStyles = true } = this.options;
    const fileId = this.genHash(filename);

    // 初始化上下文
    const ctx = this.createContext({
      fileId,
      filename,
      source,
      preprocessStyles,
    });

    // 初始化 Babel 代码生成选项
    const genOptions = this.prepareGenerateOptions(filename);

    // 处理 sfc / script 文件
    const resolveSFCAndScriptFile = () => {
      const ast = parse(source, ctx.data, { plugins: plugins?.parser });
      const ir = transform(ast, ctx.data, { plugins: plugins?.transformer });
      const gen = generate(ir, ctx.data, {
        ...genOptions,
        plugins: plugins?.codegen,
      });

      return this.resolveMainResult(ir, gen, ctx.data);
    };

    // 处理 style 文件
    const resolveStyleFile = () => {
      const result = parseOnlyStyle(source, ctx.data, { plugins: plugins?.parser });
      return this.resolveStyleResult(result, ctx.data);
    };

    try {
      const isStyleFile = ctx.data.inputType === 'style';
      const result = isStyleFile ? resolveStyleFile() : resolveSFCAndScriptFile();

      // 执行最终插件
      if (plugins) {
        const { parser, transformer, codegen, ...rest } = plugins;
        executePlugins(rest, result, ctx);
      }

      return result;
    } finally {
      // 编译结束后清理上下文
      ctx.clear();
    }
  }

  /**
   * 初始化 Babel 代码生成选项
   *
   * 合并用户自定义的生成选项与默认选项，确保代码生成的一致性和正确性。
   * 默认配置优化了代码的可读性和性能：
   * 1. 最小化 Unicode 转义：只转义必要的字符，保持代码可读性
   * 2. 统一引号风格：使用单引号，符合 JavaScript 社区常见约定
   * 3. 代码压缩：启用最小化，移除不必要的空白字符
   *
   * 如果用户提供了自定义选项，会与默认选项进行深度合并，
   * 用户选项的优先级高于默认选项。
   *
   * @private
   * @param filename - 可选的文件名，用于源码映射配置
   * @returns {GeneratorOptions} 合并后的 Babel 生成选项
   *
   * @remarks
   * - 源码映射支持：如果启用了 sourceMaps 且提供了文件名，会自动设置 sourceFileName
   * - 选项合并策略：用户选项会覆盖默认选项，实现灵活的配置
   * - 性能优化：默认启用 minified 以减少生成代码的体积
   * - 编码安全：使用 jsesc 确保特殊字符的正确转义
   *
   * @example
   * ```typescript
   * // 默认选项
   * const defaultOptions = {
   *   jsescOption: { minimal: true, quotes: 'single' },
   *   minified: true
   * };
   *
   * // 用户自定义选项
   * const userOptions = {
   *   minified: false, // 覆盖默认值
   *   sourceMaps: true // 新增选项
   * };
   *
   * // 合并结果
   * const merged = {
   *   jsescOption: { minimal: true, quotes: 'single' },
   *   minified: false, // 用户值
   *   sourceMaps: true // 用户值
   * };
   * ```
   *
   * @see {@link GeneratorOptions} Babel 生成选项类型定义
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

  /**
   * 处理 SFC 和 Script 文件的编译结果
   *
   * 根据编译上下文中的输入类型（SFC 或 Script），整理并返回相应的编译结果。
   * 对于 SFC 文件，返回包含 JSX 和 CSS 信息的完整结果；
   * 对于 Script 文件，返回仅包含脚本信息的结果。
   *
   * 关键处理逻辑：
   * 1. 构建基础结果：包含文件ID、路由信息和生成的代码
   * 2. 确定输出路径：根据源文件路径和语言类型生成输出文件路径
   * 3. 区分文件类型：
   *    - SFC 文件：生成 .tsx 扩展名，包含样式信息
   *    - Script 文件：保持原扩展名，不包含样式信息
   * 4. 样式处理：提取样式文件路径、作用域ID和样式代码
   *
   * @private
   * @param ir - React 中间表示（IR）描述符，包含转换后的组件信息
   * @param gen - 代码生成结果，包含生成的代码和源码映射
   * @param ctxData - 编译上下文数据，包含文件信息和编译状态
   * @returns {CompilationResult} 整理后的编译结果
   *
   * @remarks
   * - 文件扩展名处理：Vue SFC 文件会转换为 .tsx 或 .jsx 文件
   * - 样式分离：SFC 中的样式会被提取到独立的 CSS 文件中
   * - 路由检测：自动检测组件是否使用路由，用于依赖注入
   * - 作用域样式：为 Scoped CSS 生成唯一的作用域ID
   *
   * @see {@link SFCCompilationResult} SFC 编译结果类型
   * @see {@link ScriptCompilationResult} Script 编译结果类型
   */
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

    // 源路径处理成输出路径
    const file = this.resolveOutputPath(filename, lang);

    if (inputType === 'sfc') {
      return {
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
        ...base,
      } as SFCCompilationResult;
    }

    // script file
    return {
      fileInfo: { script: { file, lang } },
      ...base,
    } as ScriptCompilationResult;
  }

  /**
   * 处理 Style 文件的编译结果
   * @param data style 文件解析结果
   * @param ctxData 上下文数据
   */
  private resolveStyleResult(
    data: ParseResult,
    ctxData: ICompilationContext,
  ): StyleCompilationResult {
    const { fileId, filename } = ctxData;
    const { lang, content = '' } = data.style!.source!;

    // 源路径处理成输出路径
    const file = this.resolveOutputPath(filename, lang);

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
