import { Command } from 'cac';

export function resolveOptions(command: Command): Command {
  return (
    command
      // 基础路径配置
      .option('-i, --input <dir>', 'Input directory (relative to root)')
      .option('-o, --outDir <dir>', 'Output directory name')
      .option('--workspace <dir>', 'The workspace directory for cache and output')

      // 编译行为配置
      .option('--bootstrapVite', 'Enable Vite to initialize a standard React project environment.')
      .option('--exclude <pattern>', 'Exclude files/directories (glob pattern)')
      .option('--no-recursive', 'Disable recursive search in subdirectories')
      .option('--no-cache', 'Disable cache', { default: undefined })

      // 格式化配置
      .option('--format', 'Enable code formatting', { default: undefined })
      .option('--formatter <type>', 'Choose formatter: "prettier" or "builtin"')
  );
}
