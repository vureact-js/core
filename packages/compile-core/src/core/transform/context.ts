export interface TransformContext {
  source: string;
  filename: string;
  /* 收集模板 ref. <div ref="name" /> */
  nodeRefs: Set<string>;
  imports: ImportItem[];
  lang: {
    script: string;
    style: string[];
  };
}

export type ImportItem = {
  module: string;
  items: Array<{ name: string; onDemand: boolean }>;
};

export let context = createContext();

export function createContext(): TransformContext {
  return {
    source: '',
    filename: '',
    imports: [],
    nodeRefs: new Set(),
    lang: {
      script: '',
      style: [],
    },
  };
}

export const getContext = (): TransformContext => context;

export function setContext(opts: Partial<TransformContext>) {
  for (const key in opts) {
    if (key in context) {
      const oldVal = (context as any)[key];
      const newVal = (opts as any)[key];

      if (oldVal !== newVal) {
        (context as any)[key] = newVal;
      }
    }
  }
}

export const clearContext = () => {
  // @ts-ignore
  context = null;
};
