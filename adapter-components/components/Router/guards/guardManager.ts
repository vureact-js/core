import type { RouteLocation } from '../hooks/useRoute';

export interface GlobalGuards {
  beforeEach: (guard: GuardWithNextFn) => void;
  beforeResolve: (guard: GuardWithNextFn) => void;
  afterEach: (guard: NonNextFnGuard) => void;
}

export interface ExclusiveGuards {
  beforeEnter?: GuardWithNextFn | Array<GuardWithNextFn>;
}

export interface ComponentGuards {
  id: string;
  guard: NonNextFnGuard<boolean | void>;
}

export type GuardWithNextFn = (
  to: GuardRouteLocation,
  from: GuardRouteLocation,
  next: (result?: Result) => void,
) => any | Promise<any>;

export type NonNextFnGuard<T = void> = (
  to: GuardRouteLocation,
  from: GuardRouteLocation,
) => T | Promise<T>;

type Result = boolean | string | Partial<GuardRouteLocation> | Error;

export type GuardRouteLocation = RouteLocation;

type GlobalGuardsName = 'beforeEachGuards' | 'beforeResolveGuards' | 'afterEachGuards';

type ComponentGuardsName = 'beforeRouteLeaveGuards' | 'beforeRouteUpdateGuards';

export class GuardManagerImpl {
  // 全局守卫管理
  private beforeEachGuards: GuardWithNextFn[] = [];
  private beforeResolveGuards: GuardWithNextFn[] = [];
  private afterEachGuards: NonNextFnGuard[] = [];

  // 组件内守卫管理
  private beforeRouteLeaveGuards: ComponentGuards[] = [];
  private beforeRouteUpdateGuards: ComponentGuards[] = [];
  private guardIdCounter = 0;

  registerGuard(name: GlobalGuardsName, guard: GuardWithNextFn | NonNextFnGuard) {
    if (name in this) {
      // @ts-ignore
      this[name as GlobalGuardsName].push(guard);
    }
  }

  registerComponentGuard(name: ComponentGuardsName, guard: ComponentGuards['guard']): () => void {
    const id = `${name}_${this.guardIdCounter++}`;
    const handler = { id, guard };

    if (name in this) {
      this[name].push(handler);
    }

    return () => {
      const index = this[name].findIndex((h) => h.id === id);
      if (index > -1) {
        this[name].splice(index, 1);
      }
    };
  }

  private async executeGuardPipeline(
    guards: (GuardWithNextFn | NonNextFnGuard)[],
    to: GuardRouteLocation,
    from: GuardRouteLocation,
    needNextFn = true,
  ): Promise<Result> {
    try {
      for (const guard of guards) {
        const guardResult: Result = await new Promise<Result>((resolve) => {
          let nextCalled = false;

          const next = (value?: Result) => {
            if (nextCalled) {
              console.warn('[Router] next() called multiple times in navigation guard');
              return;
            }
            nextCalled = true;

            if (value instanceof Error) {
              console.error('[Router] Error passed to next():', value);
              resolve(false);
            } else if (value === undefined) {
              resolve(true);
            } else {
              resolve(value);
            }
          };

          try {
            const ret = needNextFn ? guard(to, from, next) : (guard as NonNextFnGuard)(to, from);

            // guard 返回 Promise（异步守卫）
            if (ret instanceof Promise) {
              ret
                .then((v) => {
                  if (!nextCalled) {
                    // 优先采用 Promise resolve 的值（若为 undefined 则继续）

                    resolve(v !== undefined ? (v as Result) : true);
                  }
                })
                .catch((err) => {
                  if (!nextCalled) {
                    console.error('[Router] Error in async guard:', err);
                    resolve(false);
                  }
                });
            } else {
              // guard 同步返回值
              if (ret !== undefined) {
                resolve(ret as Result);
              } else {
                // 没有返回也没调用 next：等待微任务，让同步 guard 有机会调用 next
                Promise.resolve().then(() => {
                  if (!nextCalled) {
                    // 如果仍未调用 next，则默认继续
                    resolve(true);
                  }
                });
              }
            }
          } catch (err) {
            if (!nextCalled) {
              console.error('[Router] Error when executing guard:', err);
              resolve(false);
            }
          }
        });

        // 如果某个守卫返回非 true，则中断并返回该结果（用于重定向或阻塞）
        if (guardResult !== undefined && guardResult !== true) {
          return guardResult;
        }
      }

      return true;
    } finally {
    }
  }

  async runBeforeEach(to: GuardRouteLocation, from: GuardRouteLocation): Promise<Result> {
    return this.executeGuardPipeline(this.beforeEachGuards, to, from);
  }

  async runBeforeEnter(
    to: GuardRouteLocation,
    from: GuardRouteLocation,
    beforeEnter?: ExclusiveGuards['beforeEnter'],
  ): Promise<Result | undefined> {
    if (beforeEnter) {
      // 统一处理为数组形式
      const guards = Array.isArray(beforeEnter) ? beforeEnter : [beforeEnter];
      return this.executeGuardPipeline(guards, to, from);
    }
    return;
  }

  async runBeforeResolve(to: GuardRouteLocation, from: GuardRouteLocation): Promise<Result> {
    return this.executeGuardPipeline(this.beforeResolveGuards, to, from);
  }

  async runBeforeRouteLeave(to: GuardRouteLocation, from: GuardRouteLocation): Promise<Result> {
    return this.executeGuardPipeline(
      this.beforeRouteLeaveGuards.map(({ guard }) => guard),
      to,
      from,
      false,
    );
  }

  async runBeforeRouteUpdate(to: GuardRouteLocation, from: GuardRouteLocation): Promise<Result> {
    return this.executeGuardPipeline(
      this.beforeRouteUpdateGuards.map(({ guard }) => guard),
      to,
      from,
      false,
    );
  }

  // 同步执行 afterEach（不影响导航流）
  runAfterEach(to: GuardRouteLocation, from: GuardRouteLocation): void {
    try {
      this.afterEachGuards.forEach((guard) => {
        try {
          guard(to, from);
        } catch (err) {
          console.error('[Router] Error in afterEach guard:', err);
        }
      });
    } catch (err) {
      console.error('[Router] Error executing afterEach guards:', err);
    }
  }

  clear() {
    this.beforeEachGuards.length = 0;
    this.beforeResolveGuards.length = 0;
    this.afterEachGuards.length = 0;
    this.guardIdCounter = 0;
    this.beforeRouteLeaveGuards.length = 0;
    this.beforeRouteUpdateGuards.length = 0;
  }
}
