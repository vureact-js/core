import { minimatch } from 'minimatch';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';

export function getDirname(metaUrl: string) {
  return dirname(fileURLToPath(metaUrl));
}

export function getFilename(metaUrl: string) {
  return fileURLToPath(metaUrl);
}

export class PathFilter {
  private patterns: string[] = [];
  private cwd: string;

  constructor(patterns: string[] = [], cwd: string = process.cwd()) {
    this.patterns = patterns;
    this.cwd = cwd;
  }

  /**
   * 检查路径是否应该被排除
   */
  shouldExclude(filePath: string): boolean {
    // 绝对路径和相对路径都进行测试
    const testPaths = [
      filePath, // 原始绝对路径
      path.relative(this.cwd, filePath), // 相对路径
      normalizePath(path.relative(this.cwd, filePath)), // POSIX 风格相对路径
    ];

    for (const pattern of this.patterns) {
      if (!pattern || typeof pattern !== 'string') continue;

      for (const testPath of testPaths) {
        // 处理一些常见简写
        const normalizedPattern = this.normalizePattern(pattern);

        if (
          minimatch(testPath, normalizedPattern, {
            dot: true,
            matchBase: pattern.includes('/') ? false : true,
            nocase: true,
          })
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 标准化 glob 模式
   */
  private normalizePattern(pattern: string): string {
    // 处理常见简写
    if (pattern === 'node_modules') {
      return '**/node_modules/**';
    }

    // 确保目录模式以 /** 结尾
    if (pattern.endsWith('/') && !pattern.includes('*')) {
      return `${pattern}**`;
    }

    return pattern;
  }

  /**
   * 添加默认排除模式
   */
  static withDefaults(patterns: string[] = []): string[] {
    const defaults = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '.*/**', // 隐藏目录
    ];

    return [...defaults, ...patterns];
  }
}

export function normalizePath(filePath: string): string {
  if (filePath == null) return filePath as any;

  let fp = String(filePath);

  // 如果是 file: URL，转换成文件路径
  try {
    if (fp.startsWith('file:')) {
      fp = fileURLToPath(fp);
    }
  } catch {}

  // 将所有反斜杠替换为正斜杠，并合并多个连续斜杠为单个
  fp = fp.replace(/\\/g, '/').replace(/\/\/+/, '/');

  return fp;
}
