import { GeneratorResult } from '@src/index';

export type CompilationResult =
  | SFCCompilationResult
  | ScriptCompilationResult
  | StyleCompilationResult;

// SFC 编译结果
export interface SFCCompilationResult extends BaseCompilationResult {
  fileInfo: {
    jsx: {
      file: string;
      lang: string;
    };
    css: {
      file?: string;
      hash?: string;
      code?: string;
    };
  };
}

// script 编译结果
export interface ScriptCompilationResult extends BaseCompilationResult {
  fileInfo: {
    script: {
      file: string;
      lang: string;
    };
  };
}

// style 编译结果
export interface StyleCompilationResult extends Omit<
  BaseCompilationResult,
  'hasRoute' | keyof GeneratorResult
> {
  code: string;
  fileInfo: {
    style: {
      file: string;
      lang: string;
    };
  };
}

export interface BaseCompilationResult extends GeneratorResult {
  fileId: string;
  hasRoute?: boolean;
}
