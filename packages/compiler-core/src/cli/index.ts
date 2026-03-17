#!/usr/bin/env node
import { cac } from 'cac';
import { bin, version } from '../../package.json';
import { resolveAction } from './action';
import { resolveOptions } from './option';
import { checkForUpdates } from './update-check';

const [programName] = Object.keys(bin);
const cli = cac(programName);

// 检查更新
checkForUpdates();

// build 命令：一次性编译
const buildCommand = cli.command('build [root]', 'Compile Vue3 to React (one-time)');
resolveOptions(buildCommand).action((root, options) => {
  resolveAction(root, { ...options, watch: false });
});

// watch 命令：监听模式
const watchCommand = cli.command('watch [root]', 'Compile Vue3 to React and watch for changes');
resolveOptions(watchCommand).action((root, options) => {
  resolveAction(root, { ...options, watch: true });
});

cli.help().version(version).parse();

