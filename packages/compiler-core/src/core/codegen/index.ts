import { ICompilationContext } from '@compiler/context/types';
import { ReactIRDescriptor } from '../transform';
import { generateComponent, GeneratorOptions, GeneratorResult } from './component';
import { generateOnlyScript } from './script-only';

export * from './component';
export * from './script-only';

/**
 * 代码生成的统一入口函数。
 *
 * 根据输入类型自动选择生成器：
 * - `sfc`: 生成完整的 React 组件（包含 JSX 和脚本）
 * - `script-*`: 仅生成脚本代码（如 .js、.ts）
 *
 * @param ir - React 中间表示描述符，来自转换阶段的结果
 * @param ctx - 编译上下文，包含输入类型、源码等信息
 * @param options - 可选的生成器配置，如 Babel 生成选项和插件
 * @returns 生成结果对象，包含 AST、生成的代码和原始源码
 */
export function generate(
  ir: ReactIRDescriptor,
  ctx: ICompilationContext,
  options?: GeneratorOptions,
): GeneratorResult {
  const generator = ctx.inputType === 'sfc' ? generateComponent : generateOnlyScript;
  return generator(ir, ctx, options);
}
