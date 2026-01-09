import { ICompilationContext } from './types';

export function createCompilationCtx(): CompilationContext {
  return new CompilationContext();
}

/**
 * 用于在 parse、transform、generate 中依次共享上下文信息
 */
export class CompilationContext {
  private context = {} as ICompilationContext;

  get data(): ICompilationContext {
    return this.context;
  }

  clear() {
    this.context = {} as ICompilationContext;
  }

  init(opts: Partial<ICompilationContext>) {
    this.context = { ...this.create(), ...opts };
  }

  create(): ICompilationContext {
    return {
      source: '',
      filename: '',
      imports: new Map(),
      cssVars: [],

      templateData: {
        slots: {},
        models: [],
        refs: new Set(),
      },

      scriptData: {
        lang: 'js',
        provide: {
          name: '',
          value: '',
          isOccupied: false,
          provide: {},
        },
      },
    };
  }
}
