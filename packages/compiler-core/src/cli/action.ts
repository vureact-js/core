import { CacheKey, CompilationUnit, CompilerOptions, VuReact } from '@compiler/index';
import { PathFilter } from '@shared/path';
import { calcElapsedTime } from '@utils/calc-elapsed-time';
import { formatHHMMSS } from '@utils/date';
import chokidar from 'chokidar';
import { existsSync } from 'fs';
import kleur from 'kleur';
import ora, { Ora } from 'ora';
import path from 'path';
import { pathToFileURL } from 'url';
import { CliOptions } from './types';

export async function resolveAction(root: string, options: CliOptions) {
  const start = performance.now();
  const projectRoot = root ? path.resolve(process.cwd(), root) : process.cwd();

  // 加载用户本地配置 (vureact.config.js)
  const userConfig = await loadUserConfig(projectRoot);
  const finalConfig = mergeCliConfig(projectRoot, options, userConfig);

  const compiler = new VuReact(finalConfig);
  const spinner = ora();

  // 1. 首次全量运行
  spinner.start('Compiling...');

  await compiler.execute();
  const duration = calcElapsedTime(start);

  console.info();
  spinner.succeed(kleur.bold(kleur.green(`Compilation successfully in ${duration}.`)));

  // 2. 进入监听模式
  if (finalConfig.watch) {
    setupWatcher(compiler, finalConfig, spinner);
    console.info(
      kleur.dim(`\n${formatHHMMSS()}`),
      kleur.bold(kleur.magenta('[hrm]')),
      kleur.gray(`Watching...\n`),
    );
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

  const watcher = chokidar.watch(inputPath, {
    ignored,
    persistent: true,
    ignoreInitial: true, // 初始扫描已由 compiler.execute 完成
  });

  watcher.on('all', async (event, filePath) => {
    switch (event) {
      case 'add':
      case 'change':
        spinner.start('Recompiling...');
        await onRecompile(event, filePath);
        spinner.stop();
        break;

      case 'unlink':
      case 'unlinkDir':
        await onRemoveFile(event, filePath);
        break;
    }
  });

  const onRecompile = async (event: 'add' | 'change', filePath: string) => {
    const result: { compilationUnit?: CompilationUnit; assetFile?: string } = {
      compilationUnit: undefined,
      assetFile: undefined,
    };

    if (filePath.endsWith('.vue')) {
      const unit = await compiler.processSFC(filePath);

      if (unit) {
        unit.source = '';

        if (unit.output) {
          unit.output.css.code = '';
          unit.output.jsx.code = '';
        }

        result.compilationUnit = unit;
      }
    } else if (/.(js|ts)$/.test(filePath)) {
      // todo
    } else {
      const { file } = await compiler.processAsset(filePath);
      result.assetFile = file;
    }

    // 执行 onChange
    await config.onChange?.(event, result);
  };

  const onRemoveFile = async (type: 'unlink' | 'unlinkDir', filePath: string) => {
    const removeOutputPath = (type: CacheKey) => {
      return compiler.removeOutputPath(filePath, type);
    };

    // 单个文件删除
    if (type === 'unlink') {
      if (filePath.endsWith('.vue')) {
        // 删除 Vue 文件对应的编译产物
        await removeOutputPath(CacheKey.MAIN);
      } else {
        // 删除对应附属资产
        await removeOutputPath(CacheKey.ASSET);
      }
    } else if (type === 'unlinkDir') {
      // 文件夹删除：尝试同时清理 Vue 产物和 资产产物
      // 这里不需要判断 isVue，因为文件夹本身不带后缀
      await removeOutputPath(CacheKey.MAIN);
      await removeOutputPath(CacheKey.ASSET);
    }
  };
}
