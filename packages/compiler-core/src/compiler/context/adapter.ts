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
    const inputType = CompilationAdapter.detectInputType(input.source, input.filename);

    if (inputType.startsWith('script')) {
      // 初始化script-only的上下文，无需模板和style上下文数据
      ctx.data.inputType = inputType;
      ctx.data.templateData = {} as any;
      ctx.data.styleData = {} as any;
    }

    // 初始化通用数据
    ctx.init({ inputType, ...input });

    return ctx;
  }

  static detectInputType(source: string, filename: string): FileInputType {
    const ext = path.extname(filename);
    if (ext === '.vue') return 'sfc';
    if (ext === '.ts') return 'script-ts';
    return 'script-js';
  }
}
