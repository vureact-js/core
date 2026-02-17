import { ParseResult as BabelParseResult } from '@babel/parser';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { executePlugins } from '@shared/plugin-executor';
import { PluginRegister } from '@src/compiler';
import { CompilerError, RootNode } from '@vue/compiler-core';
import {
  parse as parseVueSFC,
  SFCDescriptor,
  SFCScriptBlock,
  SFCStyleBlock,
  SFCTemplateBlock,
} from '@vue/compiler-sfc';
import { processVueSyntax } from './process';

export interface ParseResult {
  template: BlockIR<SFCTemplateBlock, RootNode>;
  script: BlockIR<SFCScriptBlock, BabelParseResult>;
  style: BlockIR<SFCStyleBlock, undefined>;
}

type BlockIR<S, T> = {
  source?: S;
  ast: T;
} | null;

export interface ParserOptions {
  plugins?: PluginRegister<ParseResult>;
}

/**
 * 解析 Vue 单文件组件（SFC）源码，生成结构化解析结果。
 *
 * 此函数是解析阶段的核心入口，
 * 负责将 Vue SFC 源码解析为包含模板、脚本、样式等各个块的结构化数据。
 *
 * @param source - Vue 单文件组件的源码字符串
 * @param ctx - 编译上下文对象
 * @param plugins - 可选的插件注册表，用于对解析结果进行自定义处理和增强
 * @returns 解析结果对象，包含模板、脚本、样式块的解析信息
 * @throws 不会直接抛出异常，错误信息会通过日志系统记录
 *
 * @remarks
 * - 函数内部使用 Vue 官方的 `@vue/compiler-sfc` 进行基础解析
 * - 解析结果会经过后处理阶段，包括脚本元数据扫描
 * - 插件按照注册顺序依次执行，可以对解析结果进行修改或增强
 * - 错误处理：语法错误和编译错误会通过日志系统记录，不会中断执行
 *
 * @example
 * ```typescript
 * // 基础用法：解析一个简单的 Vue 组件
 *
 * const vueSource = `
 * <template>
 *   <div class="greeting">
 *     Hello, {{ name }}!
 *   </div>
 * </template>
 *
 * <script setup lang="ts">
 * import { ref } from 'vue'
 *
 * const name = ref('World')
 * const count = ref(0)
 *
 * function increment() {
 *   count.value++
 * }
 * </script>
 *
 * <style scoped>
 * .greeting {
 *   color: #42b983;
 *   font-size: 1.5rem;
 * }
 * </style>
 * `;
 *
 * const ctx: ICompilationContext = {
 *   filename: 'MyComponent.vue',
 *   // 其他上下文配置...
 * };
 *
 * const result = parseSFC(vueSource, ctx);
 *
 * // 访问解析结果
 * console.log(result.template?.ast); // 模板的 AST 节点
 * console.log(result.script?.ast);   // 脚本的 Babel 解析结果
 * console.log(result.style?.source); // 样式块原始信息
 *
 * // 使用可选插件配置，进行自定义处理
 * const options: ParserOptions = {
 *   plugins: {
 *     myPlugin: (result, ctx) => {
 *       // 提取组件元数据
 *       const componentName = extractComponentName(result);
 *       // 添加自定义分析结果
 *       result.metadata = {
 *         name: componentName,
 *         analyzedAt: new Date().toISOString()
 *       };
 *     }
 *   }
 * };
 *
 * const resultWithPlugin = parseSFC(vueSource, compilationContext, options);
 * ```
 */
export function parseSFC(
  source: string,
  ctx: ICompilationContext,
  options?: ParserOptions,
): ParseResult {
  const { descriptor, errors } = parseVueSFC(source, {
    filename: ctx.filename,
  });

  const result: ParseResult = {
    template: null,
    script: null,
    style: null,
  };

  collectErrs(descriptor, errors);
  processVueSyntax(descriptor, ctx, result);
  executePlugins(options?.plugins, result, ctx);

  return result;
}

function collectErrs(descriptor: SFCDescriptor, errors: (SyntaxError | CompilerError)[]) {
  for (const err of errors) {
    logger.error(err.message, {
      source: descriptor.source,
      file: descriptor.filename,
      loc: (err as CompilerError)?.loc,
    });
  }

  if (descriptor.cssVars.length) {
    logger.error('Unable to process CSS variables in the style block', {
      file: descriptor.filename,
    });
  }
}
