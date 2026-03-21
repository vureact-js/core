import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import lockfile from 'proper-lockfile';

export interface FileLockOptions {
  /**
   * 锁过期时间（毫秒）
   * 默认: 10000 (10秒)
   */
  stale?: number;

  /**
   * 锁更新间隔（毫秒）
   * 默认: stale / 2
   */
  update?: number;

  /**
   * 重试配置
   * 可以是重试次数或 retry 选项对象
   * 默认: 5
   */
  retries?:
    | number
    | {
        retries?: number;
        factor?: number;
        minTimeout?: number;
        maxTimeout?: number;
        randomize?: boolean;
      };

  /**
   * 是否解析符号链接
   * 默认: true
   */
  realpath?: boolean;

  /**
   * 自定义锁文件路径
   * 默认: `${filePath}.lock`
   */
  lockfilePath?: string;
}

/**
 * 基于 proper-lockfile 的现代文件锁管理器
 * 提供可靠的跨进程文件读写锁机制
 */
export class FileLockManager {
  private static instance: FileLockManager;

  /**
   * 获取单例实例
   */
  static getInstance(): FileLockManager {
    if (!FileLockManager.instance) {
      FileLockManager.instance = new FileLockManager();
    }
    return FileLockManager.instance;
  }

  /**
   * 获取文件锁并更新文件内容
   * @param filePath 文件路径
   * @param updater 更新函数，接收当前内容，返回更新后的内容
   * @param options 锁选项
   */
  async updateFile<T>(
    filePath: string,
    updater: (current: T | null) => T | Promise<T>,
    options: FileLockOptions = {},
  ): Promise<T> {
    return this.withLock(
      filePath,
      async () => {
        // 读取文件内容
        let current: T | null = null;

        try {
          const content = await fs.promises.readFile(filePath, 'utf-8');

          if (content.trim()) {
            // 尝试解析为 JSON，如果失败则作为字符串处理
            try {
              current = JSON.parse(content);
            } catch {
              // 如果解析失败，可能是字符串内容
              current = content as T;
            }
          }
        } catch (error) {
          // 文件不存在，使用 null
          console.error(kleur.red('✖'), `Failed to read file ${filePath}`);
          console.error(error);
        }

        // 执行更新
        const updated = await updater(current);

        // 写入更新后的内容
        const contentToWrite =
          typeof updated === 'string' ? updated : JSON.stringify(updated, null, 2);

        await this.writeFile(filePath, contentToWrite);

        return updated;
      },
      options,
    );
  }

  /**
   * 获取文件锁并执行操作
   * @param filePath 文件路径
   * @param operation 要执行的操作函数
   * @param options 锁选项
   */
  async withLock<T>(
    filePath: string,
    operation: () => Promise<T>,
    options: FileLockOptions = {},
  ): Promise<T> {
    const {
      stale = 10000,
      update = stale / 2,
      retries = 5,
      realpath = true,
      lockfilePath,
    } = options;

    // 确保目录存在
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    try {
      await fs.promises.access(filePath);
    } catch {
      // 文件不存在，创建空文件
      await this.writeFile(filePath, '');
    }

    // 使用 proper-lockfile 获取锁
    const release = await lockfile.lock(filePath, {
      stale,
      update,
      retries,
      realpath,
      lockfilePath,
    });

    try {
      // 执行操作
      return await operation();
    } finally {
      // 释放锁
      await release();
    }
  }

  /**
   * 检查文件是否被锁定
   * @param filePath 文件路径
   * @param options 锁选项
   */
  async isLocked(
    filePath: string,
    options: Omit<FileLockOptions, 'retries'> = {},
  ): Promise<boolean> {
    const { stale = 10000, realpath = true, lockfilePath } = options;

    try {
      return await lockfile.check(filePath, { stale, realpath, lockfilePath });
    } catch {
      return false;
    }
  }

  /**
   * 尝试获取锁（非阻塞）
   * @param filePath 文件路径
   * @param options 锁选项
   * @returns 如果成功获取锁，返回释放函数；否则返回 null
   */
  async tryLock(
    filePath: string,
    options: Omit<FileLockOptions, 'retries'> = {},
  ): Promise<(() => Promise<void>) | null> {
    const { stale = 10000, update = stale / 2, realpath = true, lockfilePath } = options;

    try {
      const release = await lockfile.lock(filePath, {
        stale,
        update,
        retries: 0, // 不重试
        realpath,
        lockfilePath,
      });
      return release;
    } catch {
      return null;
    }
  }

  /**
   * 释放文件锁
   * @param filePath 文件路径
   * @param options 锁选项
   */
  async unlock(
    filePath: string,
    options: Omit<FileLockOptions, 'retries' | 'stale' | 'update'> = {},
  ): Promise<void> {
    const { realpath = true, lockfilePath } = options;

    try {
      await lockfile.unlock(filePath, { realpath, lockfilePath });
    } catch {}
  }

  private async writeFile(filePath: string, content: string) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }
}

export const fileLock = FileLockManager.getInstance();
