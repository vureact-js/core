import { ICompilationContext } from '@compiler/context/types';
import { ParseResult } from '@parse/index';
import { executePlugins } from '@shared/plugin-executor';
import { PluginRegister } from '@src/compiler';
import { ScriptBlockIR, resolveScript } from './script';
import { TemplateBlockIR, resolveTemplate } from './template';

export interface ReactIRDescriptor {
  template: TemplateBlockIR;
  script: ScriptBlockIR;
  style?: string;
}

export interface TransformerOptions {
  plugins?: PluginRegister<ReactIRDescriptor>;
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
 *
 * @returns React 中间表示描述符，包含模板、脚本和样式的转换结果
 */
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
