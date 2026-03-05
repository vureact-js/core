import kleur from 'kleur';
import { FileCompiler } from '.';
import {
  BaseCompilationResult,
  BaseUnit,
  CacheKey,
  CompilationResult,
  CompilationUnit,
  ScriptCompilationResult,
  ScriptUnit,
  SFCCompilationResult,
  SFCUnit,
  StyleCompilationResult,
  StyleUnit,
} from '../types';

export class CompilationUnitProcessor {
  constructor(private fileCompiler: FileCompiler) {}

  /**
   * 处理编译单元，落地成对应代码和文件
   */
  async resolve(unit: CompilationUnit, key: CacheKey): Promise<CompilationUnit> {
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
  private resolveResult(result: CompilationResult, unit: CompilationUnit, key: CacheKey) {
    const { fileId, code } = result;

    unit.fileId = fileId; // 文件 id

    const isSFC = key === CacheKey.SFC;
    const isScriptFile = key === CacheKey.SCRIPT;
    const isStyleFile = key === CacheKey.STYLE;

    // 是否使用了路由，用于后续注入 @vureact/router 的依据
    if (isSFC || isScriptFile) {
      (unit as BaseUnit).hasRoute = (result as BaseCompilationResult)?.hasRoute;
    }

    const resolveFileInfo = () => {
      // 处理 SFC 文件信息
      if (isSFC) {
        const component = result as SFCCompilationResult;
        const { jsx, css } = component.fileInfo;

        // 如果有 css 产物文件，则添加对应输出路径（注意，勿和单个 style 文件混淆）
        if (css.file) {
          css.file = this.fileCompiler.resolveOutputPath(css.file);
        }

        unit.output = {
          jsx: {
            file: jsx.file,
            code,
          },
          css,
        };
      }

      // 处理 Script 文件信息
      else if (isScriptFile) {
        const { script } = (result as ScriptCompilationResult).fileInfo;

        // script 仅需处理一项
        unit.output = {
          script: {
            file: script?.file,
            code,
          },
        };
      }

      // 处理 Style 文件信息
      else if (isStyleFile) {
        const { style } = (result as StyleCompilationResult).fileInfo;

        // style 仅需处理一项
        unit.output = {
          style: {
            file: style.file,
            code,
          },
        };
      }
    };

    resolveFileInfo();
  }

  /**
   * 将编译产物写入磁盘
   */
  async saveCompiledFiles(unit: CompilationUnit, key: CacheKey) {
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
    } else if (key === CacheKey.STYLE) {
      const { style } = (output as StyleUnit['output'])!;
      file = style.file;
      code = style.code;
    } else {
      const { script } = (output as ScriptUnit['output'])!;
      file = script.file;
      code = script.code;
    }

    await this.fileCompiler.writeFileWithDir(file, code);
  }
}
