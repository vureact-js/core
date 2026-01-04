import { createContext } from 'react';

export type ContextKey = string | number | symbol;

class GlobalContextRegistry {
  private map = new Map<ContextKey, React.Context<any>>();

  create<T>(name: ContextKey, defaultValue?: T): React.Context<T> {
    if (!this.map.has(name)) {
      this.map.set(name, createContext<T | undefined>(defaultValue));
    }
    return this.getContext(name);
  }

  getContext<T>(name: ContextKey): React.Context<T> {
    return this.map.get(name)!;
  }

  clear() {
    this.map.clear();
  }
}

export const contextRegistry = new GlobalContextRegistry();
