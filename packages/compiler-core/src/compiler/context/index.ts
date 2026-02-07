import { ICompilationContext } from './types';

export function createCompilationCtx(): CompilationContext {
  return new CompilationContext();
}

/**
 * 创建单独的局部上下文
 *
 * 用于在 parse、transform、generate 中依次共享上下文信息
 */
export class CompilationContext {
  private context = {} as ICompilationContext;

  get data(): ICompilationContext {
    return this.context;
  }

  clear() {
    this.context = this.create();
  }

  init(opts: Partial<ICompilationContext>) {
    this.context = { ...this.create(), ...opts };
  }

  create(): ICompilationContext {
    return {
      fileId: '',
      source: '',
      filename: '',
      funcName: '',
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
        propsTSIface: {
          name: '',
          propsTypes: [],
          emitTypes: [],
          slotTypes: [],
        },
        source: '',
      },

      styleData: {
        filePath: '',
      },
    };
  }
}
