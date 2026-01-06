import { LangType } from './babel-utils';

export interface CompileContextType {
  source: string;
  filename: string;
  imports: Map<string, ImportItem[]>;
  lang: {
    script: LangType;
    style: string[];
  };
  templateRefs: Set<string>;
  templateSlots: Record<string, object>;
  templateVModels: Array<VModelHandler>;
  ctxProvider: {
    exists: boolean;
    name: string;
    value: string;
    ctxProvider: CompileContextType['ctxProvider'] | Partial<CompileContextType['ctxProvider']>;
  };
}

export type ImportItem = { name: string; onDemand: boolean };

export type VModelHandler = {
  key: string;
  handler: {
    name: string;
    exp: {
      arg: string;
      body: {
        setterExp: {
          name: string;
          arg: string;
          body: string;
        };
      };
    };
  };
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
      imports: new Map(),
      lang: {
        script: 'js',
        style: [],
      },
      templateRefs: new Set(),
      templateSlots: {},
      templateVModels: [],
      ctxProvider: {
        exists: false,
        name: '',
        value: '',
        ctxProvider: {},
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
