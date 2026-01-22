import { normalizePath } from '@src/shared/path';
import { genHashByXXH } from '@src/utils/hash';
import fs from 'fs';
import kleur from 'kleur';
import path from 'path';
import { version } from '../../package.json';
import { generate } from '../core/codegen';
import { parse } from '../core/parse';
import { transform } from '../core/transform';
import { logger } from '../shared/logger';
import { createCompilationCtx } from './context';
import { CompilerHelper } from './helper';
import { CachedResult, CompilationUnit, CompileResult, CompilerOptions } from './types';

export class VuReactCompiler extends CompilerHelper {
  private options: CompilerOptions;
  private compilationUnits: CompilationUnit[] = [];

  // 本次 run() 发现的所有源文件列表，用于清理已删除的缓存/输出文件
  private discoveredFiles: string[] = [];

  constructor(options: CompilerOptions = {}) {
    super(options);
    this.options = options;
  }

  /**
   * Get compiler version.
   */
  get version(): string {
    return version;
  }

  /**
   * @todo
   */
  async watch() {}

  /**
   * Run the batch compilation process.
   */
  async run() {
    // eslint-disable-next-line no-console
    console.info(kleur.bold(kleur.gray(`\n\n   VuReact v${this.version}\n\n`)));
    this.print('Compiling...');

    const start = performance.now();

    const { cacheDirectory = true } = this.options;

    // 1. 读取所有 .vue 文件
    await this.readVueFiles(this.getInputPath());

    // 2.记录本次发现的所有源文件
    this.discoveredFiles = this.compilationUnits.map((u) => u.file);

    if (!this.compilationUnits.length) {
      this.print(kleur.yellow('No .vue files found'));
      return;
    }

    // 3.缓存对比
    await this.filterByCache();

    // 4.并行编译所有 .vue 文件
    await this.compileVueFiles();

    // 5.并行写入 react 文件
    await this.writeReactFiles();

    // 6.清理已不存在的输出文件
    await this.removeDeletedOutputs();

    // 7.编译结果写入文件缓存
    if (cacheDirectory) {
      await this.writeFileCache();
    }

    this.skippedFilesCount();
    this.clear();

    // 计算总耗时
    const duration = this.formattDuration(performance.now() - start);
    // eslint-disable-next-line no-console
    console.info(kleur.bold(kleur.green(`\nCompiled successfully in ${duration}.`)));
  }

  private async readVueFiles(inputPath: string) {
    // 判断输入路径类型
    let stats: fs.Stats;

    try {
      stats = await fs.promises.stat(inputPath);
    } catch (e) {
      this.print(kleur.red(`The input path ${inputPath} does not exist or is not accessible`));
      console.error('\n', e, '\n');
      return;
    }

    const { input } = this.options;

    // 单个文件
    if (stats.isFile()) {
      if (inputPath.endsWith('.vue')) {
        const source = await fs.promises.readFile(inputPath, 'utf-8');

        this.compilationUnits.push({
          file: inputPath,
          source,
          output: null,
          fileSize: stats.size,
          mtime: stats.mtimeMs,
        });
      } else {
        this.print(kleur.red(`The input file ${input} is not a .vue file`));
      }
    } else if (stats.isDirectory()) {
      // 目录 - 递归查找所有 .vue 文件
      await this.collectVueFilesFromDir(inputPath);
    } else {
      this.print(
        kleur.red(`The input path ${input} does not exist or is not a valid file/directory`),
      );
    }
  }

  /**
   * 从目录递归收集所有 .vue 文件
   */
  private async collectVueFilesFromDir(dirPath: string) {
    const { recursive = true } = this.options;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    // 并行读取 .vue 文件
    const readPromises = entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);

      // 跳过不需要的目录
      if (this.shouldSkipPath(fullPath)) {
        return;
      }

      if (recursive && entry.isDirectory()) {
        // 递归处理子目录
        await this.collectVueFilesFromDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.vue')) {
        await this.readVueFiles(fullPath);
      }
    });

    await Promise.all(readPromises);
  }

  /**
   * 通过缓存对比，过滤出需要重新编译的文件
   */
  private async filterByCache() {
    try {
      // 读取缓存文件
      const cacheFilePath = this.getCacheFilePath();

      if (!fs.existsSync(cacheFilePath)) {
        // 无旧缓存，所有文件都需编译
        return;
      }

      const content = await fs.promises.readFile(cacheFilePath, 'utf-8');
      const cache = JSON.parse(content) as CachedResult;

      // 将缓存转换为Map以便快速查找（以文件路径为键）
      const cacheMap = new Map(cache.data.map((unit) => [unit.file, unit]));

      const unitsToCompile: CompilationUnit[] = [];

      // 过滤出需要重新编译的文件
      for (const currentUnit of this.compilationUnits) {
        const cachedUnit = cacheMap.get(currentUnit.file);

        if (!cachedUnit) {
          // 没有缓存记录，需要编译
          unitsToCompile.push(currentUnit);
          continue;
        }

        // 1. 元数据对比
        if (
          cachedUnit.fileSize === currentUnit.fileSize &&
          currentUnit.mtime === cachedUnit.mtime
        ) {
          // 元数据完全一致，极大概率未变化，直接使用缓存输出
          currentUnit.output = cachedUnit.output;
          continue;
        }

        // 2. 内容哈希对比
        // 只有元数据不同或文件不存在于缓存时，才需要计算哈希
        const currentHash = genHashByXXH(currentUnit.source);

        if (cachedUnit?.hash === currentHash) {
          // 哈希一致，内容实际相同，使用缓存
          currentUnit.output = cachedUnit.output;
        } else {
          // 哈希不同，或文件不存在于缓存中，需要编译
          // 将当前计算出的哈希存入unit，供后续缓存写入使用
          currentUnit.hash = currentHash;
          unitsToCompile.push(currentUnit);
        }
      }

      // 更新编译单元列表
      this.compilationUnits = unitsToCompile;
    } catch (e) {
      // 缓存读取失败，忽略错误并编译所有文件
      this.print(kleur.yellow('Cache read failed, recompiling all files'));
      console.error('\n', e, '\n');
    }
  }

  /**
   * 编译所有 Vue SFC 文件为 React 组件
   */
  private async compileVueFiles() {
    const { format } = this.options;

    // 使用 Promise.all 并行编译
    const processedUnits = this.compilationUnits.map(async (unit) => {
      try {
        const start = performance.now();

        // 编译
        const result = this.compile(unit.source, unit.file);

        // 默认不启用代码格式化，这会增加编译耗时
        const formattedCode = !format?.enabled ? result.code : await this.formatCode(result);

        const data: CompilationUnit = {
          ...unit,
          output: {
            file: result.file,
            code: formattedCode,
            map: result.map,
          },
        };

        // 计算单个编译的核心耗时
        const duration = this.formattDuration(performance.now() - start);

        // 输出编译信息
        this.print(
          kleur.magenta('Compiled'),
          kleur.cyan(normalizePath(this.relativePath(unit.file))),
          kleur.dim(`(${duration})`),
        );

        return data;
      } catch (e) {
        // 编译失败，保留原始单元
        this.print(kleur.red(`Failed to compile ${this.relativePath(unit.file)}`));
        console.error('\n', e, '\n');
        return unit;
      }
    });

    const units = await Promise.all(processedUnits);

    // 更新 compilationUnits
    this.compilationUnits = units;
  }

  private async writeReactFiles() {
    // 并行写入 jsx 文件
    const writePromises = this.compilationUnits.map(async (unit) => {
      // 跳过没有生成输出的单元（可能是编译失败）
      if (!unit.output) {
        this.print(kleur.yellow(`Skipping write for ${unit.file} (no output)`));
        return;
      }

      const { file, code } = unit.output;

      // 确保目录存在
      const outputDir = path.dirname(file);

      await fs.promises.mkdir(outputDir, { recursive: true });

      // 写入文件
      await fs.promises.writeFile(file, code, 'utf-8');
    });

    // 等待所有写入操作完成
    await Promise.all(writePromises);
  }

  /**
   * Compiles Vue source code into React code.
   *
   * @param source - The Vue source code string to compile
   * @param filename - Filename with path or only filename
   * @returns {CompileResult} The compilation result containing generated react component code and metadata
   * @throws Will not throw, errors are caught and log
   *
   * @example
   * ```ts
   * const result = compiler.compile('<template><div>Hello</div></template>', 'App.vue');
   * ```
   */
  compile(source: string, filename = 'anonymous.vue'): CompileResult {
    const { logging } = this.options;

    // 创建编译上下文
    const ctx = createCompilationCtx();

    ctx.init({ source, filename });

    try {
      const ast = parse(source, ctx.data);
      const ir = transform(ast, ctx.data);
      const result = generate(ir, ctx.data, this.prepareGenerateOptions(filename));

      const { lang } = ctx.data.scriptData;
      const outputPath = this.resolveOutputPath(filename, lang);

      return { file: outputPath, lang, ...result };
    } finally {
      // 打印三个核心模块处理过程中收集的日志消息
      if (logging?.enabled !== false && logger.getLogs().length) {
        logger.printAll(logging);
      }

      // 编译结束后清理上下文
      ctx.clear();
    }
  }

  /**
   * 删除输出目录中对应于已被删除的源文件的生成文件
   */
  private async removeDeletedOutputs() {
    const cacheFilePath = this.getCacheFilePath();

    if (!fs.existsSync(cacheFilePath)) {
      return;
    }

    let existingCache: CachedResult | null = null;
    try {
      const content = await fs.promises.readFile(cacheFilePath, 'utf-8');
      existingCache = JSON.parse(content) as CachedResult;
    } catch {
      return;
    }

    const discoveredSet = new Set(this.discoveredFiles || []);

    for (const unit of existingCache.data || []) {
      if (!unit || !unit.file) continue;

      // 如果源文件不在本次发现列表，则其输出应被删除
      if (!discoveredSet.has(unit.file)) {
        const out = unit.output?.file;
        if (out && fs.existsSync(out)) {
          try {
            await fs.promises.unlink(out);
          } catch {}
        }
      }
    }
  }

  /**
   * 编译结果写入文件缓存
   */
  private async writeFileCache() {
    const file = this.getCacheFilePath();

    // 读取已有缓存（如果存在），以便与本次编译结果合并，避免覆盖未变更的条目
    let existingCache: CachedResult | null = null;

    if (fs.existsSync(file)) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        existingCache = JSON.parse(content) as CachedResult;
      } catch (e) {
        existingCache = null;
        console.error(e);
      }
    }

    const cacheMap = new Map<string, any>();

    if (existingCache?.data && Array.isArray(existingCache.data)) {
      for (const u of existingCache.data) {
        cacheMap.set(u.file, u);
      }
    }

    // 将本次编译单元（通常仅包含需要重新编译的文件）合并到缓存中
    for (const unit of this.compilationUnits) {
      const { source: _, ...rest } = unit as any;

      // 保留 output.code，但剔除 map（如果存在）以减小缓存体积
      if (rest.output && rest.output.map) {
        rest.output.map = null;
      }

      cacheMap.set(rest.file, rest);
    }

    const merged = Array.from(cacheMap.values());

    // 根据本次发现的源文件列表，剔除已不存在的缓存项
    const discoveredSet = new Set(this.discoveredFiles || []);
    const filtered = merged.filter((u: any) => discoveredSet.has(u.file));

    const data = JSON.stringify({ data: filtered } as CachedResult);

    await fs.promises.writeFile(file, data, 'utf-8');
  }

  /**
   * 输出已跳过编译的文件统计信息
   */
  private skippedFilesCount() {
    const skippedCount = this.discoveredFiles.length - this.compilationUnits.length;

    if (skippedCount > 0) {
      this.print(
        kleur.green(`✓`),
        kleur.gray(`Skipped ${skippedCount} unchanged file(s) using cache`),
      );
    }
  }

  clear() {
    this.compilationUnits = [];
  }
}
