import { PathFilter } from '@src/shared/path';
import chokidar from 'chokidar';
import { existsSync } from 'fs';
import kleur from 'kleur';
import ora, { Ora } from 'ora';
import path from 'path';
import { pathToFileURL } from 'url';
import { CacheFilename, CompilerOptions, VuReact } from '../compiler';
import { CliOptions } from './types';

export async function cliAction(root: string, options: CliOptions) {
  const projectRoot = root ? path.resolve(process.cwd(), root) : process.cwd();

  // 加载用户本地配置 (vureact.config.js)
  const userConfig = await loadUserConfig(projectRoot);
  const finalConfig = mergeCliConfig(projectRoot, options, userConfig);

  const compiler = new VuReact(finalConfig);
  const spinner = ora();

  // 1. 首次全量运行
  spinner.start('🚀 Compiling...');
  await compiler.execute();
  spinner.succeed('✨ Compilation finished.');

  // 2. 进入监听模式
  if (finalConfig.watch) {
    setupWatcher(compiler, finalConfig, spinner);
  }
}

async function loadUserConfig(root: string): Promise<CompilerOptions> {
  const configPath = path.resolve(root, 'vureact.config.js');

  if (!existsSync(configPath)) return {};

  try {
    // 使用 pathToFileURL 解决 Windows 绝对路径无法直接 import 的问题
    const configUrl = pathToFileURL(configPath).href;
    const module = await import(configUrl);
    // 处理 export default 或 module.exports
    return module.default || module;
  } catch (err) {
    console.warn(
      kleur.yellow(`\n⚠️  Load config failed at ${configPath}, using default options.`),
      err,
    );
    return {};
  }
}

function mergeCliConfig(
  projectRoot: string,
  options: CliOptions,
  userConfig: CompilerOptions,
): CompilerOptions {
  return {
    root: projectRoot,
    input: options.input || userConfig.input,
    watch: options.watch ?? userConfig.watch,
    recursive: options.recursive ?? userConfig.recursive,

    exclude: options.exclude
      ? Array.isArray(options.exclude)
        ? options.exclude
        : [options.exclude]
      : userConfig.exclude,

    output: {
      workspace: options.workspace || userConfig.output?.workspace,
      outDir: options.outDir || userConfig.output?.outDir,
    },

    format: {
      enabled: options.format ?? userConfig.format?.enabled,
      formatter: options.formatter || userConfig.format?.formatter,
    },
  };
}

function setupWatcher(compiler: VuReact, config: CompilerOptions, spinner: Ora) {
  const inputPath = path.resolve(config.root!, config.input!);
  const ignored = !config.exclude?.length ? PathFilter.withDefaults() : config.exclude;

  // eslint-disable-next-line no-console
  console.info(`\n👀 Watching for changes in: ${config.input}\n`);

  const watcher = chokidar.watch(inputPath, {
    ignored,
    persistent: true,
    ignoreInitial: true, // 初始扫描已由 compiler.execute 完成
  });

  watcher.on('all', async (event, filePath) => {
    const isVue = filePath.endsWith('.vue');

    const removeOutputPath = (type: CacheFilename) => compiler.removeOutputPath(filePath, type);

    switch (event) {
      case 'add':
      case 'change':
        if (isVue) {
          await compiler.processSingleFile(filePath);
        } else {
          await compiler.processSingleAsset(filePath);
        }

        spinner.succeed();
        break;

      case 'unlink':
        // 单个文件删除
        if (isVue) {
          await removeOutputPath(CacheFilename.COMPILE);
        } else {
          await removeOutputPath(CacheFilename.ASSET);
        }

        spinner.succeed();
        break;

      case 'unlinkDir':
        // 文件夹删除：尝试同时清理 Vue 产物和 资产产物
        // 这里不需要判断 isVue，因为文件夹本身不带后缀
        await removeOutputPath(CacheFilename.COMPILE);
        await removeOutputPath(CacheFilename.ASSET);
        spinner.succeed();
        break;
    }
  });
}
