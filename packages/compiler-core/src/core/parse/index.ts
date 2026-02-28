import { ICompilationContext } from '@compiler/context/types';
import { parseOnlyScript } from './script-only';
import { ParseResult, ParserOptions, parseSFC } from './sfc';

export * from './script-only';
export * from './sfc';

/**
 * 解析 Vue 组件源码的统一入口函数。
 *
 * 根据输入类型自动选择解析器：
 * - `sfc`: 解析 Vue 单文件组件（包含 template/script/style）
 * - `script-*`: 仅解析脚本文件（如 .js、.ts）
 *
 * @param source - 源码字符串
 * @param ctx - 编译上下文，包含输入类型、文件名等信息
 * @param options - 可选的解析器配置，如插件
 * @returns 解析结果对象，包含模板、脚本、样式的结构化数据
 */
export function parse(
  source: string,
  ctx: ICompilationContext,
  options?: ParserOptions,
): ParseResult {
  const parser = ctx.inputType === 'sfc' ? parseSFC : parseOnlyScript;
  return parser(source, ctx, options);
}
