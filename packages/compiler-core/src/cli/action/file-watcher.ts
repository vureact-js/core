import { CacheKey, CompilerOptions, Helper, VuReact } from '@compiler/index';
import { normalizePath } from '@shared/path';
import { calcElapsedTime } from '@utils/calc-elapsed-time';
import chokidar from 'chokidar';
import kleur from 'kleur';
import ora from 'ora';
import path from 'path';

/**
 * 设置文件监听器
 */
export function setupWatcher(compiler: VuReact, config: CompilerOptions) {
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
    '.less': (p: string) => compiler.processStyle(p),
    '.sass': (p: string) => compiler.processStyle(p),
    '.scss': (p: string) => compiler.processStyle(p),
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

    const scriptExtRegex = /\.(js|ts)$/i;
    const styleExtRegex = /\.(less|sass|scss)$/i;

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

      if (scriptExtRegex.test(ext)) {
        await removeFile(CacheKey.SCRIPT);
        return;
      }

      if (styleExtRegex.test(ext)) {
        await removeFile(CacheKey.STYLE);
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
      await removeFile(CacheKey.STYLE);
      await removeFile(CacheKey.ASSET);
    }
  };
}