import { cac } from 'cac';
import { version } from '../../package.json';
import { cliAction } from './action';

const cli = cac('vureact');

cli
  .command('[root]', 'Compile Vue files to React')
  // 基础路径配置
  .option('-i, --input <dir>', 'Input directory (relative to root)', { default: 'src' })
  .option('-o, --outDir <dir>', 'Output directory name', { default: 'dist' })
  .option('-ws, --workspace <dir>', 'The workspace directory for cache and output', {
    default: '.vureact',
  })

  // 编译行为配置
  .option('--exclude <pattern>', 'Exclude files/directories (glob pattern)')
  .option('--no-recursive', 'Disable recursive search in subdirectories')

  // 格式化配置
  .option('--no-format', 'Disable code formatting')
  .option('--formatter <type>', 'Choose formatter: "prettier" or "builtin"', {
    default: 'prettier',
  })

  // 模式切换
  .option('-w, --watch', 'Watch mode: compile on file changes')

  .action(cliAction);

cli.help().version(version).parse();
