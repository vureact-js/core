import { Command } from 'cac';

export function resolveOptions(command: Command): Command {
  return (
    command
      // 基础路径配置
      .option('-i, --input <dir>', 'Input directory (relative to root)')
      .option('-o, --outDir <dir>', 'Output directory name')
      .option('--workspace <dir>', 'The workspace directory for cache and output')
  );
}
