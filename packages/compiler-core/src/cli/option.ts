import { Command } from 'cac';

export function resolveOptions(command: Command): Command {
  return (
    command
      // 基础路径配置
      .option('-i, --input <dir>', 'Input directory (relative to root)', { default: 'src' })
      .option('-o, --outDir <dir>', 'Output directory name', { default: 'dist' })
      .option('--workspace <dir>', 'The workspace directory for cache and output', {
        default: '.vureact',
      })

      // 编译行为配置
      .option('--exclude <pattern>', 'Exclude files/directories (glob pattern)')
      .option('--no-recursive', 'Disable recursive search in subdirectories')

      // 格式化配置
      .option('--format', 'Enable code formatting', { default: false })
      .option('--formatter <type>', 'Choose formatter: "prettier" or "builtin"', {
        default: 'prettier',
      })

      // 模式切换
      .option('-w, --watch', 'Watch mode: compile on file changes')
  );
}
