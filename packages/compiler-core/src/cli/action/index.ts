import { VuReact } from '@compiler/index';
import kleur from 'kleur';
import path from 'path';
import { loadUserConfig } from './config-loader';
import { mergeConfig } from './config-merger';
import { setupWatcher } from './file-watcher';
import { CliOptions } from './types';

export async function resolveAction(root: string, options: CliOptions) {
  const projectRoot = root ? path.resolve(process.cwd(), root) : process.cwd();

  // 加载用户本地配置 (vureact.config.js 或 vureact.config.ts)
  const userConfig = await loadUserConfig(projectRoot);
  const finalConfig = mergeConfig(projectRoot, options, userConfig);

  const compiler = new VuReact(finalConfig);

  // 1. 首次全量运行
  await compiler.execute();

  // 2. 如果是 watch 模式，进入监听模式
  if (finalConfig.watch) {
    setupWatcher(compiler, finalConfig);
    console.info(
      kleur.dim(`\n${new Date().toLocaleTimeString()}`),
      kleur.bold(kleur.magenta('[hrm]')),
      kleur.gray(`Watching for file changes...\n`),
    );
  }
}
