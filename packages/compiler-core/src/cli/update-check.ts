import { getDirname } from '@shared/path';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import updateNotifier from 'update-notifier';

// 获取当前文件的目录
const __dirname = getDirname(import.meta.url);

export function checkForUpdates() {
  try {
    // 读取 package.json 获取当前版本
    // 尝试多个可能的路径，以兼容不同环境
    const possiblePaths = [
      './package.json', // 当前目录
      'package.json', // 当前目录（另一种写法）
      '../package.json', // 上一级目录（构建环境）
      '../../package.json', // 上两级目录（开发环境）
    ];

    let pkgPath = '';
    for (const relPath of possiblePaths) {
      const testPath = join(__dirname, relPath);
      if (existsSync(testPath)) {
        pkgPath = testPath;
        break;
      }
    }

    if (!pkgPath) {
      // 如果所有路径都失败，静默返回
      return;
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60 * 24, // 每天检查一次 (24小时)
      shouldNotifyInNpmScript: true,
    });

    // 检查更新（异步，结果会缓存）
    notifier.notify();
  } catch (error) {
    // 静默失败，不干扰正常功能
    // 在生产环境中，console.debug 可能不会被输出
    if (process.env.NODE_ENV === 'development') {
      console.debug('Update check failed:', error);
    }
  }
}
