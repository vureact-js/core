import kleur from 'kleur';
import { Helper } from '../helper';
import {
  CacheKey,
  CompilerOptions,
  ScriptCompilationResult,
  ScriptUnit,
  SFCCompilationResult,
  SFCUnit,
} from '../types';
export class CompilationUnitProcessor {
  constructor(
    private helper: Helper,
    private options: CompilerOptions,
  ) {}

  /**
   * 处理编译单元，落地成对应代码和文件
   */
  async process(unit: SFCUnit | ScriptUnit, key: CacheKey): Promise<SFCUnit | ScriptUnit> {
    try {
      // 调用编译器的 compile 方法
      // 注意：这里假设 helper 实际上是 BaseCompiler 实例
      const compiler = this.helper as any;
      const result = compiler.compile(unit.source, unit.file);
      const formattedCode = await this.helper.formatCode(result);

      unit.fileId = result.fileId;

      if (key === CacheKey.SFC) {
        const { jsx, css } = (result as SFCCompilationResult).fileInfo;

        if (css.file) {
          css.file = this.helper.resolveOutputPath(css.file);
        }

        unit.output = {
          jsx: {
            file: jsx.file,
            code: formattedCode,
          },
          css,
        };
      } else if (key === CacheKey.SCRIPT) {
        const { script } = (result as ScriptCompilationResult).fileInfo;

        unit.output = {
          script: {
            file: script.file,
            code: formattedCode,
          },
        };
      }
    } catch (err) {
      console.info(
        kleur.red(`✖`),
        `Failed to compile ${this.helper.relativePath(unit.file)}\n`,
        err,
      );
    }

    return unit;
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
        await this.helper.writeFileWithDir(css.file, css.code);
      }
    } else {
      const { script } = (output as ScriptUnit['output'])!;
      file = script.file;
      code = script.code;
    }

    await this.helper.writeFileWithDir(file, code);
  }
}
