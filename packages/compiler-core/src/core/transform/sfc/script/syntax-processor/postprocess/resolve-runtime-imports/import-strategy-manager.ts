import {
  ImportStrategy,
  StyleFileStrategy,
  VueEcosystemStrategy,
  VueRouterStrategy,
} from './import-strategies';

export class ImportStrategyManager {
  private strategies: ImportStrategy[] = [];

  constructor() {
    // 按优先级顺序添加策略
    this.strategies.push(new VueRouterStrategy());
    this.strategies.push(new VueEcosystemStrategy());
    this.strategies.push(new StyleFileStrategy());
  }

  /** 添加自定义策略 */
  addStrategy(strategy: ImportStrategy) {
    this.strategies.push(strategy);
  }

  /** 查找匹配的策略 */
  findStrategy(moduleName: string): ImportStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.matches(moduleName)) {
        return strategy;
      }
    }
    return null;
  }
}
