import { ICompilationContext } from '@compiler/context/types';
import { executePlugins } from '@shared/plugin-executor';
import { PluginRegister } from '@src/compiler';
import { ParseResult } from '../parse';
import { ScriptBlockIR, resolveScript } from './script';
import { TemplateBlockIR, resolveTemplate } from './template';

export interface ReactIRDescriptor {
  template: TemplateBlockIR;
  script: ScriptBlockIR;
  style?: string;
}

/**
 * 将 Vue SFC 解析结果转换为 React 中间表示（IR）。
 *
 * 此函数是转换阶段的核心入口，负责将 Vue 组件的解析结果（AST）转换为
 * 适合生成 React 代码的中间表示形式。转换过程包括模板转换和脚本转换。
 *
 * @param ast - Vue SFC 的解析结果，来自 {@link parse} 函数的返回值
 * @param ctx - 编译上下文对象
 * @param plugins - 可选的插件注册表，用于对转换结果进行自定义处理和增强
 * @returns React 中间表示描述符，包含模板、脚本和样式的转换结果
 *
 * @remarks
 * - 模板转换：将 Vue 模板 AST 转换为 React 可用的模板 IR
 * - 脚本转换：将 Vue 脚本 AST 转换为 React 可用的脚本 IR
 * - 样式处理：提取样式块内容，保留原始 CSS 字符串
 * - 插件支持：支持通过插件对转换结果进行自定义处理
 *
 * @example
 * ```typescript
 * // 转换示例
 *
 * const ctx: ICompilationContext = {
 *   filename: 'MyComponent.vue',
 *   // 其他上下文配置...
 * };
 *
 * // 1. 首先解析 Vue SFC
 * const parseResult = parse(vueSource, ctx);
 *
 * // 2. 将解析结果转换为 React IR
 * const reactIR = transform(parseResult, ctx);
 *
 * // 访问转换结果
 * console.log(reactIR.template); // 模板转换结果
 * console.log(reactIR.script);   // 脚本转换结果
 * console.log(reactIR.style);    // 样式内容字符串
 *
 * // 使用可选插件配置，进行自定义处理
 * const options: TransformerOptions = {
 *   plugins: {
 *     extractMetadata: (result, ctx) => {
 *       const componentName = extractComponentNameFromScript(result.script);
 *       const propsCount = countProps(result.script);
 *
 *       result.metadata = {
 *         name: componentName,
 *         propsCount,
 *         hasStyle: !!result.style,
 *         convertedAt: new Date().toISOString(),
 *       };
 *     },
 *
 *     // 插2：样式预处理
 *     preprocessStyles: (result, ctx) => {
 *       if (result.style) {
 *         // 对样式进行预处理，如添加前缀等
 *         result.style = addVendorPrefixes(result.style);
 *         result.style = minifyCSS(result.style);
 *       }
 *     },
 *   }
 * }
 *
 * // 使用多个插件进行转换
 * const reactIRWithPlugins = transform(parseResult, ctx, plugins);
 *
 * // 插件处理后的结果包含自定义数据
 * console.log(reactIRWithPlugins.metadata);
 * ```
 */

export interface TransformerOptions {
  plugins?: PluginRegister<ReactIRDescriptor>;
}

export function transform(
  ast: ParseResult,
  ctx: ICompilationContext,
  options?: TransformerOptions,
): ReactIRDescriptor {
  const { template, script, style } = ast;

  const templateIR = resolveTemplate(template?.ast, ctx);
  const scriptIR = resolveScript(script?.ast, ctx);

  const result = {
    template: templateIR,
    script: scriptIR,
    style: style?.source?.content,
  };

  executePlugins(options?.plugins, result, ctx);

  return result;
}
