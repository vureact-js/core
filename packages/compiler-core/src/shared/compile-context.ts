import { LangType } from './babel-utils';

export interface CompileContextType {
  source: string;
  filename: string;
  imports: Map<string, ImportItem[]>;
  lang: {
    script: LangType;
    style: string[];
  };
  templateVar: {
    ids: Set<string>; // 普通变量
    refs: Set<string>; // node ref
    vModels: Array<{ getterName: string; setterName: string }>; // v-model
  };
  templateSlots: Record<string, object>;
}

export type ImportItem = { name: string; onDemand: boolean };

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
      imports: new Map(),
      lang: {
        script: 'js',
        style: [],
      },
      templateVar: {
        vModels: [],
        ids: new Set(),
        refs: new Set(),
      },
      templateSlots: {},
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
