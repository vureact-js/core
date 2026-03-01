import kleur from 'kleur';
import { FileCompiler } from '.';
import {
  CacheKey,
  CompilationResult,
  ScriptCompilationResult,
  ScriptUnit,
  SFCCompilationResult,
  SFCUnit,
} from '../types';

export class CompilationUnitProcessor {
  constructor(private fileCompiler: FileCompiler) {}

  /**
   * 处理编译单元，落地成对应代码和文件
   */
  async resolve(unit: SFCUnit | ScriptUnit, key: CacheKey): Promise<SFCUnit | ScriptUnit> {
    try {
      // 调用核心编译方法
      const result = this.fileCompiler.compile(unit.source, unit.file);

      // 格式化代码
      result.code = await this.fileCompiler.formatCode(result);

      // 处理编译结果
      this.resolveResult(result, unit, key);
    } catch (err) {
      console.info(
        kleur.red(`✖`),
        `Failed to compile ${this.fileCompiler.relativePath(unit.file)}\n`,
        err,
      );
    }

    return unit;
  }

  // 处理编译结果
  private resolveResult(result: CompilationResult, unit: SFCUnit | ScriptUnit, key: CacheKey) {
    const { fileId, code, hasRoute } = result;

    unit.fileId = fileId; // 文件 id
    unit.hasRoute = hasRoute; // 是否使用了路由，用于后续注入 @vureact/router 的依据

    // 处理 SFC/Script 文件信息
    if (key === CacheKey.SFC) {
      const component = result as SFCCompilationResult;
      const { jsx, css } = component.fileInfo;

      // 如果有 css 文件则添加对应输出路径
      if (css.file) {
        css.file = this.fileCompiler.resolveOutputPath(css.file);
      }

      unit.output = {
        // 添加 jsx 文件信息
        jsx: {
          file: jsx.file,
          code,
        },
        css, // 添加 css 文件信息
      };
    } else if (key === CacheKey.SCRIPT) {
      const { script } = (result as ScriptCompilationResult).fileInfo;
      // script 仅需处理一项
      unit.output = {
        script: {
          file: script.file,
          code,
        },
      };
    }
  }

  /**
   * 将编译产物写入磁盘
   */
  async saveCompiledFiles(unit: SFCUnit | ScriptUnit, key: CacheKey) {
    const output = unit.output;
    if (!output) return;

    let file = '';
    let code = '';

    if (key === CacheKey.SFC) {
      const { jsx, css } = (output as SFCUnit['output'])!;
      file = jsx.file;
      code = jsx.code;

      // 如果有样式产物，写入 CSS 文件
      if (css.file && css.code) {
        await this.fileCompiler.writeFileWithDir(css.file, css.code);
      }
    } else {
      const { script } = (output as ScriptUnit['output'])!;
      file = script.file;
      code = script.code;
    }

    await this.fileCompiler.writeFileWithDir(file, code);
  }
}
