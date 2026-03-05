import path from 'path';
import { CompilationContext, createCompilationCtx } from './creator';
import { FileInputType, ICompilationContext } from './types';

export interface CompilationInput extends Partial<ICompilationContext> {
  source: string;
  filename: string;
}

export class CompilationAdapter {
  static createContext(input: CompilationInput): CompilationContext {
    const ctx = createCompilationCtx();
    const inputType = CompilationAdapter.detectInputType(input.filename);

    const initTemplateData = () => {
      ctx.data.templateData = {} as any;
    };
    const initScriptData = () => {
      ctx.data.scriptData = {} as any;
    };
    const initStyleData = () => {
      ctx.data.styleData = {} as any;
    };

    if (inputType.startsWith('script-')) {
      // 初始化 script-only 的上下文，无需模板和 style 上下文数据
      initTemplateData();
      initStyleData();
    } else if (inputType === 'style') {
      // 初始化 style-only 的上下文，无需模板和 script 上下文数据
      initTemplateData();
      initScriptData();
    }

    // 初始化通用数据
    ctx.init({ inputType, ...input });

    return ctx;
  }

  static detectInputType(filename: string): FileInputType {
    const ext = path.extname(filename).toLowerCase();

    switch (ext) {
      case '.vue':
        return 'sfc';

      case '.js':
        return 'script-js';

      case '.ts':
        return 'script-ts';

      case '.css':
      case '.less':
      case '.sass':
      case '.scss':
        return 'style';

      default:
        return 'unknow';
    }
  }
}
