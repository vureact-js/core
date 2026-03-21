import { CompilerOptions } from '@compiler/index';
import { CliOptions } from './types';

/**
 * 合并配置：CLI 参数 + 用户配置文件
 */
export function mergeConfig(
  projectRoot: string,
  options: CliOptions,
  userConfig: CompilerOptions,
): CompilerOptions {
  const merged = {
    ...userConfig,
    ...options,
    root: projectRoot,
  } as CompilerOptions;

  // 处理 output 配置
  merged.output = {
    ...userConfig.output,
    workspace: options.workspace ?? userConfig.output?.workspace,
    outDir: options.outDir ?? userConfig.output?.outDir,
  };

  return merged;
}