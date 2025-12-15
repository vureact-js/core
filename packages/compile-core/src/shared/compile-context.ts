import { LangType } from './babel-utils';

export interface CompileContextType {
  source: string;
  filename: string;
  /* 收集模板 ref. <div ref="name" /> */
  nodeRefs: Set<string>;
  /* 收集模板 v-model，用于创建 usestate */
  models: Array<{ varName: string; setterName: string }>;
  imports: ImportItem[];
  lang: {
    script: LangType;
    style: string[];
  };
}

export type ImportItem = {
  module: string;
  items: Array<{ name: string; onDemand: boolean }>;
};

class CompileContext {
  private ctx: CompileContextType;

  constructor() {
    this.ctx = this.createContext();
  }

  get context(): CompileContextType {
    return this.ctx;
  }

  createContext = (): CompileContextType => {
    return {
      source: '',
      filename: '',
      imports: [],
      models: [],
      nodeRefs: new Set(),
      lang: {
        script: 'js',
        style: [],
      },
    };
  };

  setContext = (opts: Partial<CompileContextType>) => {
    for (const key in opts) {
      if (key in this.ctx) {
        const oldVal = (this.ctx as any)[key];
        const newVal = (opts as any)[key];

        if (oldVal !== newVal) {
          (this.ctx as any)[key] = newVal;
        }
      }
    }
  };

  clear = () => {
    // @ts-ignore
    this.ctx = null;
  };
}

export const compileContext = new CompileContext();
