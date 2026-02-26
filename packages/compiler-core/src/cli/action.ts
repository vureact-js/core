import { CacheKey, CompilerOptions, Helper, VuReact } from '@compiler/index';
import { normalizePath } from '@shared/path';
import { calcElapsedTime } from '@utils/calc-elapsed-time';
import chokidar from 'chokidar';
import { existsSync } from 'fs';
import kleur from 'kleur';
import ora from 'ora';
import path from 'path';
import { pathToFileURL } from 'url';
import { CliOptions } from './types';

export async function resolveAction(root: string, options: CliOptions) {
  const projectRoot = root ? path.resolve(process.cwd(), root) : process.cwd();

  // 加载用户本地配置 (vureact.config.js)
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
      kleur.yellow('\n⚠'),
      `Load config failed at ${configPath}, using default options`,
      err,
    );
    return {};
  }
}

function mergeConfig(
  projectRoot: string,
  options: CliOptions,
  userConfig: CompilerOptions,
): CompilerOptions {
  const merged = {
    ...userConfig,
    ...options,
    root: projectRoot,
  } as CompilerOptions;

  // 处理 exclude 数组
  if (options.exclude) {
    merged.exclude = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
  } else if (userConfig.exclude) {
    merged.exclude = userConfig.exclude;
  }

  // 处理 output 配置
  merged.output = {
    ...userConfig.output,
    workspace: options.workspace ?? userConfig.output?.workspace,
    outDir: options.outDir ?? userConfig.output?.outDir,
    bootstrapVite: options.bootstrapVite ?? userConfig.output?.bootstrapVite,
  };

  // 处理 format 配置
  merged.format = {
    enabled: options.format ?? userConfig.format?.enabled,
    formatter: options.formatter ?? userConfig.format?.formatter,
  };

  return merged;
}

function setupWatcher(compiler: VuReact, config: CompilerOptions) {
  const spinner = ora();
  const cmpHelper = new Helper(config);

  const watcher = chokidar.watch(cmpHelper.getInputPath(), {
    ignored: cmpHelper.getExcludes(),
    persistent: true,
    ignoreInitial: true, // 初始扫描已由 compiler.execute 完成
  });

  watcher.on('all', async (event, filePath) => {
    switch (event) {
      case 'add':
      case 'change':
        await onRecompile(event, filePath);
        break;

      case 'unlink':
      case 'unlinkDir':
        await onRemoveFile(event, filePath);
        break;
    }
  });

  const processors = {
    '.vue': (p: string) => compiler.processSFC(p),
    '.js': (p: string) => compiler.processScript(p),
    '.ts': (p: string) => compiler.processScript(p),
  };

  const onRecompile = async (event: 'add' | 'change', filePath: string) => {
    const ext = path.extname(filePath);

    if (ext in processors) {
      spinner.start('Recompiling...');

      const startTime = performance.now();
      const fn = processors[ext as keyof typeof processors];
      const unit = await fn(filePath);

      cmpHelper.printCoreLogs();
      cmpHelper.printCompileInfo(filePath, calcElapsedTime(startTime));

      // 调用编译器 onChange 方法
      if (unit) {
        await config.onChange?.(event, unit);
      }
    } else {
      spinner.start('Updating assets...');
      await compiler.processAsset(filePath);

      cmpHelper.print(
        kleur.blue('Copied Asset'),
        kleur.dim(normalizePath(cmpHelper.relativePath(filePath))),
      );
    }

    spinner.stop();
  };

  const onRemoveFile = async (type: 'unlink' | 'unlinkDir', filePath: string) => {
    const ext = path.extname(filePath);

    const removeFile = async (type: CacheKey) => {
      await compiler.removeOutputPath(filePath, type);
      cmpHelper.print(
        kleur.yellow('Removed'),
        kleur.dim(normalizePath(cmpHelper.relativePath(filePath))),
      );
    };

    // 单个文件删除
    if (type === 'unlink') {
      if (ext === '.vue') {
        await removeFile(CacheKey.SFC);
        return;
      }

      if (ext === '.js' || ext === '.ts') {
        await removeFile(CacheKey.SCRIPT);
        return;
      }

      await removeFile(CacheKey.ASSET);
      return;
    }

    // 文件夹删除：尝试同时清理 Vue 产物和 资产产物
    // 这里不需要判断 isVue，因为文件夹本身不带后缀
    if (type === 'unlinkDir') {
      await removeFile(CacheKey.SFC);
      await removeFile(CacheKey.SCRIPT);
      await removeFile(CacheKey.ASSET);
    }
  };
}
