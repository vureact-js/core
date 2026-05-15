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
    ignoreInitial: true,
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
    const relativePath = normalizePath(cmpHelper.relativePath(filePath));

    if (ext in processors) {
      spinner.start('Recompiling...');

      const startTime = performance.now();
      const fn = processors[ext as keyof typeof processors];
      const unit = await fn(filePath);

      cmpHelper.printCoreLogs();

      // fix: 只当编译产出才打印 Compiled，缓存命中会明确打印 Cached。
      if (unit) {
        cmpHelper.print(
          kleur.green('compiled'),
          kleur.dim(relativePath),
          kleur.gray(`(${calcElapsedTime(startTime)})`),
        );
        await config.onChange?.(event, unit);
      } else {
        cmpHelper.print(kleur.gray('cached'), kleur.dim(relativePath));
      }
    } else {
      spinner.start('Updating assets...');
      await compiler.processAsset(filePath);

      cmpHelper.print(kleur.blue('Copied Asset'), kleur.dim(relativePath));
    }

    spinner.stop();
  };

  const onRemoveFile = async (type: 'unlink' | 'unlinkDir', filePath: string) => {
    const ext = path.extname(filePath);
    const relativePath = normalizePath(cmpHelper.relativePath(filePath));

    const scriptExtRegex = /\.(js|ts)$/i;
    const styleExtRegex = /\.(css|less|sass|scss)$/i;

    const removeFile = async (cacheKey: CacheKey) => {
      await compiler.removeOutputPath(filePath, cacheKey);
      cmpHelper.print(kleur.yellow('Removed'), kleur.dim(relativePath));
    };

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

    if (type === 'unlinkDir') {
      await removeFile(CacheKey.SFC);
      await removeFile(CacheKey.SCRIPT);
      await removeFile(CacheKey.STYLE);
      await removeFile(CacheKey.ASSET);
    }
  };
}
